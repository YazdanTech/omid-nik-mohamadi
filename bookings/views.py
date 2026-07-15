from datetime import datetime, timedelta, time

from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from services.models import Service

from .models import Booking, BookingSlot
from .serializers import BookingSerializer, CreateBookingSerializer


class AvailableSlotsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        date_param = request.query_params.get("date")
        duration_param = request.query_params.get("duration")

        if not date_param or not duration_param:
            return Response({"detail": "date و duration الزامی است"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            target_date = datetime.strptime(date_param, "%Y-%m-%d").date()
            duration = int(duration_param)
        except ValueError:
            return Response({"detail": "پارامترها نامعتبر است"}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Define shop hours (09:00 to 23:00 in 30-minute steps)
        start_hour = 9
        end_hour = 23
        step_minutes = 30

        # 2. Get existing booked times for this date from the database
        booked_times = set(
            BookingSlot.objects.filter(date=target_date, is_booked=True)
            .values_list("start_time", flat=True)
        )

        # 3. Dynamically build in-memory BookingSlot objects for the full day
        virtual_slots = []
        current_time = datetime.combine(target_date, time(hour=start_hour))
        end_time = datetime.combine(target_date, time(hour=end_hour))

        while current_time < end_time:
            slot_time = current_time.time()
            # If this time exists as booked in DB, mark it as booked. Otherwise, it is free.
            is_booked = slot_time in booked_times
            
            # We mock the class instance structure so your sliding window logic doesn't break
            virtual_slots.append(
                BookingSlot(
                    date=target_date,
                    start_time=slot_time,
                    is_booked=is_booked
                )
            )
            current_time += timedelta(minutes=step_minutes)

        # 4. Apply your contiguous sliding-window logic
        required_slots = max(1, -(-duration // 30))
        available_starts = []

        for i in range(len(virtual_slots) - required_slots + 1):
            window = virtual_slots[i : i + required_slots]

            contiguous = True
            for j in range(1, len(window)):
                prev_dt = datetime.combine(target_date, window[j - 1].start_time)
                curr_dt = datetime.combine(target_date, window[j].start_time)
                if curr_dt - prev_dt != timedelta(minutes=30):
                    contiguous = False
                    break

            if contiguous and all(not s.is_booked for s in window):
                available_starts.append(window[0].start_time)

        return Response(
            {
                "date": date_param,
                "duration": duration,
                "available_slots": available_starts,
            },
            status=status.HTTP_200_OK,
        )
class CreateBookingView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CreateBookingSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        service = get_object_or_404(Service, id=data["service_id"], is_active=True)
        required_slots = max(1, -(-service.duration_minutes // 30))

        with transaction.atomic():
            slots = list(
                BookingSlot.objects.select_for_update()
                .filter(date=data["date"], start_time__gte=data["start_time"])
                .order_by("start_time")[:required_slots]
            )

            if len(slots) != required_slots or any(s.is_booked for s in slots):
                return Response({"detail": "بازه زمانی در دسترس نیست"}, status=status.HTTP_409_CONFLICT)

            for i in range(1, len(slots)):
                prev_dt = datetime.combine(data["date"], slots[i - 1].start_time)
                curr_dt = datetime.combine(data["date"], slots[i].start_time)
                if curr_dt - prev_dt != timedelta(minutes=30):
                    return Response({"detail": "بازه زمانی پیوسته نیست"}, status=status.HTTP_409_CONFLICT)

            primary_slot = slots[0]
            for s in slots:
                s.is_booked = True
            BookingSlot.objects.bulk_update(slots, ["is_booked"])

            bypass_code_obj = data.get("bypass_code_obj")

            booking = Booking.objects.create(
                user=request.user,
                service=service,
                slot=primary_slot,
                deposit_paid=bool(bypass_code_obj),
                bypass_code_used=bypass_code_obj,
                status=Booking.Status.CONFIRMED if bypass_code_obj else Booking.Status.PENDING,
            )

        return Response(BookingSerializer(booking).data, status=status.HTTP_201_CREATED)


class PaymentVerifyView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return self._verify(request)

    def post(self, request):
        return self._verify(request)

    def _verify(self, request):
        booking_id = request.data.get("booking_id") or request.query_params.get("booking_id")
        payment_success = request.data.get("success") or request.query_params.get("success")

        booking = get_object_or_404(Booking, id=booking_id)

        with transaction.atomic():
            if str(payment_success).lower() in ("1", "true"):
                booking.deposit_paid = True
                booking.status = Booking.Status.CONFIRMED
                booking.save(update_fields=["deposit_paid", "status"])
            else:
                booking.status = Booking.Status.CANCELLED
                booking.save(update_fields=["status"])
                booking.slot.is_booked = False
                booking.slot.save(update_fields=["is_booked"])

        return Response(BookingSerializer(booking).data, status=status.HTTP_200_OK)
