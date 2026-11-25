import { describe, it, expect } from "vitest";
import { doctorPhotoCandidates } from "./doctorPhotos";

describe("doctor photo identity", () => {
  it("replaces the unavailable old project with the same doctor's uploaded original", () => {
    const urls = doctorPhotoCandidates("Ташева Азиза Олимжоновна", "https://eqvwmwycjunvtyzbycis.supabase.co/storage/v1/object/public/doctor-photos/415cbda8-653b-45ff-aa3e-94305b632db7.webp");
    expect(urls).toEqual(["https://main.med24.uz/uploads/doctor-watermark/5c/f0/5cf08fd1d7893caaef7c6f6f208c4c10.jpeg"]);
  });
  it("never substitutes someone else's photo for a missing one", () => {
    expect(doctorPhotoCandidates("Missing doctor", null)).toEqual([]);
  });
  it("keeps a newly uploaded photo first", () => {
    expect(doctorPhotoCandidates("Ташева Азиза Олимжоновна", "https://med1.uz/new.webp")[0]).toBe("https://med1.uz/new.webp");
  });
});