import { NextResponse } from 'next/server';
import { houseService } from '@/modules/house/house.service';
import { notificationService } from '@/modules/email/notification.service';
import { withAuth } from '@/lib/api-auth';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const propertyType = url.searchParams.get('propertyType') || undefined;
    const result = await houseService.list({ propertyType });
    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error('[API HOUSES GET] Error:', err);
    return NextResponse.json({ success: true, data: [] }, { status: 200 });
  }
}

export const POST = withAuth(async (req: Request, user: any) => {
  try {
    const contentType = req.headers.get('content-type') || '';

    const vendorId = user.userId;
    let houseData: any;
    let imageUrls: string[] = [];

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();

      // Upload images
      const imageFiles = formData.getAll('images');
      for (const file of imageFiles) {
        if (file instanceof File) {
          const buffer = Buffer.from(await file.arrayBuffer());
          const url = await houseService.uploadImage(buffer, file.name, file.type);
          if (url) imageUrls.push(url);
        }
      }

      // Parse JSON fields from form data if they exist
      const faqs: any[] = [];
      formData.forEach((value, key) => {
        const match = key.match(/^faqs\[(\d+)\]\[(question|answer)\]$/);
        if (match) {
          const index = parseInt(match[1]);
          const field = match[2];
          if (!faqs[index]) faqs[index] = {};
          faqs[index][field] = value;
        }
      });

      const amenities: any = {
        commonAmenities: formData.getAll('commonAmenities[]'),
        roomAmenities: formData.getAll('roomAmenities[]'),
        servicesAmenities: formData.getAll('servicesAmenities[]'),
        foodAmenities: formData.getAll('foodAmenities[]'),
      };

      houseData = {
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        propertyType: formData.get('propertyType') as any,
        address: formData.get('address') as string,
        city: formData.get('city') as string,
        state: formData.get('state') as string,
        pincode: formData.get('pincode') as string,
        bedrooms: parseInt(formData.get('bedrooms') as string) || 1,
        bathrooms: parseInt(formData.get('bathrooms') as string) || 1,
        area: parseFloat(formData.get('area') as string) || undefined,
        roomSize: formData.get('roomSize') as string,
        bedType: formData.get('bedType') as string,
        pricePerMonth: parseFloat(formData.get('pricePerMonth') as string) || undefined,
        pricePerDay: parseFloat(formData.get('pricePerDay') as string) || undefined,
        singleSharingPrice: parseFloat(formData.get('singleSharingPrice') as string) || undefined,
        doubleSharingPrice: parseFloat(formData.get('doubleSharingPrice') as string) || undefined,
        tripleSharingPrice: parseFloat(formData.get('tripleSharingPrice') as string) || undefined,
        securityDeposit: parseFloat(formData.get('securityDeposit') as string) || undefined,
        lockinPeriod: formData.get('lockinPeriod') as string,
        noticePeriod: formData.get('noticePeriod') as string,
        electricityIncluded: formData.get('electricityIncluded') === 'true',
        electricityCharge: parseFloat(formData.get('electricityCharge') as string) || undefined,
        locationUrl: formData.get('locationUrl') as string,
        tenantsStaying: parseInt(formData.get('tenantsStaying') as string) || 0,
        faqs: faqs.filter(f => f.question && f.answer),
        amenities,
        images: imageUrls,
      };
    } else {
      const body = await req.json();
      houseData = body;
    }

    if (!vendorId) {
      return NextResponse.json({ success: false, error: 'Vendor ID is required.' }, { status: 200 });
    }

    const result = await houseService.create(vendorId, houseData);

    if (result.success && result.data) {
      notificationService.notify({
        userId: vendorId,
        title: 'Property Listed',
        message: `Your property "${houseData.title}" has been listed successfully.`,
        type: 'success',
      }).catch(() => {});
    }

    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error('[API HOUSES POST] Error:', err);
    return NextResponse.json({ success: false, error: 'Failed to add property.' }, { status: 200 });
  }
}, 'vendor');
