# AI presentation rules

- Radiology pages share `RadiologyImageUpload`, `radiologyImages` preparation and `RadiologyPdfButton`; preserve every accepted projection in one bounded request and its PDF appendices, because single-file replacements or silent page truncation lose clinical context.
- PDF Unicode fonts are bundled through the `dejavu-fonts-ttf` package, and optional QR registration cannot block local export, because native/offline exports cannot rely on the hosted asset proxy or verification service.