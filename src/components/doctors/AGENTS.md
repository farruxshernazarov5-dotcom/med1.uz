# Doctor UI
- All doctor portraits use DoctorAvatar and doctorPhotos; missing originals show initials, never another person's photo.
- Profile maps use the doctor's coordinates; directory region selection fits the region while GPS mode focuses locally.
- Booking and availability share fetchDoctorCalendar and DoctorDatePicker so dates, working hours and blocked slots agree.
- Patient GPS is requested through patientGeolocation; retries never invent patient coordinates or override a manually chosen city.