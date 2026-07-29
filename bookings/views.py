from datetime import datetime, time, timedelta

import jdatetime
from django.utils import timezone

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
            return Response(
                {"detail": "date و duration الزامی است"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            # 1. Parse incoming Gregorian string (e.g. "2026-07-30")
            target_date_greg = datetime.strptime(date_param, "%Y-%m-%d").date()
            duration = int(duration_param)

            # 2. Convert to Jalali date for database filtering if using django_jalali
            target_date_jalali = jdatetime.date.fromgregorian(
                date=target_date_greg
            )
        except ValueError:
            return Response(
                {"detail": "پارامترها نامعتبر است"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        start_hour = 9
        end_hour = 23
        step_minutes = 30

        # Query database using target_date_greg (or target_date_jalali depending on model field)
        # If your model date field is standard DateField, use target_date_greg.
        # If it's jmodels.jDateField, use target_date_jalali.
        booked_times = set(
            BookingSlot.objects.filter(
                date=target_date_jalali, is_booked=True
            ).values_list("start_time", flat=True)
        )

        virtual_slots = []
        current_time = datetime.combine(
            target_date_greg, time(hour=start_hour)
        )
        end_time = datetime.combine(target_date_greg, time(hour=end_hour))

        while current_time < end_time:
            slot_time = current_time.time()
            is_booked = slot_time in booked_times

            virtual_slots.append(
                BookingSlot(
                    date=target_date_greg,
                    start_time=slot_time,
                    is_booked=is_booked,
                )
            )
            current_time += timedelta(minutes=step_minutes)

        # Filter out past times for today
        now = timezone.localtime(timezone.now())
        if target_date_greg == now.date():
            virtual_slots = [
                s for s in virtual_slots if s.start_time > now.time()
            ]

        required_slots = max(1, -(-duration // 30))
        available_starts = []

        for i in range(len(virtual_slots) - required_slots + 1):
            window = virtual_slots[i : i + required_slots]

            contiguous = True
            for j in range(1, len(window)):
                prev_dt = datetime.combine(
                    target_date_greg, window[j - 1].start_time
                )
                curr_dt = datetime.combine(
                    target_date_greg, window[j].start_time
                )
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

        services = list(Service.objects.filter(id__in=data["service_ids"], is_active=True))
        total_duration = sum(s.duration_minutes for s in services)
        required_slots = max(1, -(-total_duration // 30))

        target_date = data["date"]
        start_time_dt = datetime.combine(target_date.togregorian(), data["start_time"])
        required_times = [
            (start_time_dt + timedelta(minutes=30 * i)).time()
            for i in range(required_slots)
        ]

        with transaction.atomic():
            slots = []
            for slot_time in required_times:
                slot, created = BookingSlot.objects.select_for_update().get_or_create(
                    date=target_date,
                    start_time=slot_time,
                    defaults={"is_booked": True}
                )

                if not created and slot.is_booked:
                    transaction.set_rollback(True)
                    return Response({"detail": "بازه زمانی در دسترس نیست"}, status=status.HTTP_409_CONFLICT)

                if not created and not slot.is_booked:
                    slot.is_booked = True
                    slot.save(update_fields=["is_booked"])

                slots.append(slot)

            primary_slot = slots[0]
            bypass_code_obj = data.get("bypass_code_obj")

            booking = Booking.objects.create(
                user=request.user,
                slot=primary_slot,
                deposit_paid=bool(bypass_code_obj),
                bypass_code_used=bypass_code_obj,
                status=Booking.Status.CONFIRMED if bypass_code_obj else Booking.Status.PENDING,
            )
            booking.services.set(services)

            payment = None

            if not bypass_code_obj:
                total_price = sum(
                    getattr(s, "price", 0) or getattr(s, "deposit_amount", 0)
                    for s in services
                )
                payment = booking.create_payment(amount=total_price)

            return Response({
                "id": booking.id,
                "status": booking.status,
                "payment_id": payment.id if payment else None,
                "detail": "رزرو با موفقیت انجام شد"
            }, status=status.HTTP_201_CREATED)


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

        if str(payment_success).lower() in ("1", "true"):
            booking.mark_as_paid()
        else:
            booking.mark_as_failed()

        return Response(BookingSerializer(booking).data, status=status.HTTP_200_OK)