# Doctor UI
- All doctor portraits use DoctorAvatar and doctorPhotos; missing originals show initials, never another person's photo.
- Profile maps use the doctor's coordinates; directory region selection fits the region while GPS mode focuses locally.
- Booking and availability share fetchDoctorCalendar and DoctorDatePicker so dates, working hours and blocked slots agree.
- Patient GPS is requested through patientGeolocation; retries never invent patient coordinates or override a manually chosen city.
- Calendar exports share calendarEvent and CalendarEventButton with user-confirmed device editors; OS notification reminders remain independent, preventing silent calendar writes and duplicate domain logic.
- Jitsi handoffs share jitsiMeeting; never infer meeting attendance or duration from launching another app, because its call lifecycle is not observable here.
- Booking QR details use the existing appointment and payment account permissions; canonical HTTPS links avoid native-localhost QR failures without exposing patient data publicly.