# backend/mpesa_utils.py
import requests
import base64
from datetime import datetime
from requests.auth import HTTPBasicAuth
from dotenv import load_dotenv
import os

load_dotenv()

# Pull the variables securely!
CONSUMER_KEY = os.getenv("DARAJA_CONSUMER_KEY")
CONSUMER_SECRET = os.getenv("DARAJA_CONSUMER_SECRET")
PASSKEY = os.getenv("DARAJA_PASSKEY")
BUSINESS_SHORTCODE = "174379"


def get_mpesa_access_token():
    api_url = "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"
    r = requests.get(api_url, auth=HTTPBasicAuth(CONSUMER_KEY, CONSUMER_SECRET))
    return r.json()['access_token']

def generate_password(formatted_time):
    data_to_encode = BUSINESS_SHORTCODE + PASSKEY + formatted_time
    encoded_string = base64.b64encode(data_to_encode.encode())
    return encoded_string.decode('utf-8')

def format_phone_number(phone):
    """Converts 07XX, 7XX, 1XX, or +254 to standard 254..."""
    phone = str(phone).strip().replace("+", "").replace(" ", "")
    
    if phone.startswith("0"):
        return "254" + phone[1:]
    elif phone.startswith("7") or phone.startswith("1"):
        if len(phone) == 9:
            return "254" + phone
            
    return phone # Returns the original if it already starts with 254