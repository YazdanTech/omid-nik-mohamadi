import sys 

def send_otp_sms(phone_number, code):
    # Local terminal testing fallback
    print("\n" + "="*40, file=sys.stderr)
    print(f"📡 [SMS SIMULATOR] Sending OTP to: {phone_number}", file=sys.stderr)
    print(f"🔑 VERIFICATION CODE: {code}", file=sys.stderr)
    print("="*40 + "\n", file=sys.stderr)
    return True