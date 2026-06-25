from geopy.geocoders import Nominatim
import time

geolocator = Nominatim(
    user_agent="IntelliFix/1.0",
    timeout=10
)

def get_coordinates(location):

    queries = [
        f"{location}, Bengaluru, Karnataka, India",
        f"{location}, Bangalore, Karnataka, India",
        location,
        "Bengaluru, Karnataka, India"
    ]

    for query in queries:

        print("Trying:", query)

        try:

            time.sleep(1)

            loc = geolocator.geocode(
                query,
                country_codes="in",
                addressdetails=True
            )

            print("Result:", loc)

            if loc:
                return {
                    "latitude": loc.latitude,
                    "longitude": loc.longitude,
                    "address": loc.address
                }

        except Exception as e:
            print("ERROR:", e)

    return None