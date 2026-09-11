# bookings/management/commands/expire_unpaid_bookings.py

from datetime import timedelta

from django.contrib.contenttypes.models import ContentType
from django.core.management.base import BaseCommand
from django.utils import timezone

from bookings.models import Booking
from payments.models import Payment


class Command(BaseCommand):
    help = "Deletes PENDING bookings older than 10 minutes with no successful payment, freeing their slots."

    EXPIRY_MINUTES = 10

    def handle(self, *args, **options):
        cutoff = timezone.now() - timedelta(minutes=self.EXPIRY_MINUTES)

        stale_bookings = Booking.objects.filter(
            status=Booking.Status.PENDING,
            created_at__lt=cutoff,
        )

        booking_ct = ContentType.objects.get_for_model(Booking)

        paid_booking_ids = set(
            Payment.objects.filter(
                content_type=booking_ct,
                object_id__in=[str(b.id) for b in stale_bookings],
                status=Payment.Status.SUCCESS,
            ).values_list("object_id", flat=True)
        )

        deleted_count = 0
        for booking in stale_bookings:
            if str(booking.id) in paid_booking_ids:
                continue
            booking.delete()  # cascades to BookingSlot rows
            deleted_count += 1

        self.stdout.write(self.style.SUCCESS(f"Expired and deleted {deleted_count} unpaid booking(s)."))