import { NextResponse } from 'next/server';
import { vehicleService } from '@/modules/vehicle/vehicle.service';
import { notificationService } from '@/modules/email/notification.service';
import { withAuth } from '@/lib/api-auth';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const type = url.searchParams.get('type') || undefined;
    const result = await vehicleService.list({ type });
    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error('[API VEHICLES GET] Error:', err);
    return NextResponse.json({ success: true, data: [] }, { status: 200 });
  }
}

export const POST = withAuth(async (req: Request, user: any) => {
  try {
    const contentType = req.headers.get('content-type') || '';

    const vendorId = user.userId;
    let vehicleData: any;
    let imageUrls: string[] = [];

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();

      // Upload images
      const imageFiles = formData.getAll('images');
      for (const file of imageFiles) {
        if (file instanceof File) {
          const buffer = Buffer.from(await file.arrayBuffer());
          const url = await vehicleService.uploadImage(buffer, file.name, file.type);
          if (url) imageUrls.push(url);
        }
      }

      vehicleData = {
        name: formData.get('name') as string,
        type: formData.get('type') as string,
        brand: formData.get('brand') as string,
        model: formData.get('model') as string,
        year: parseInt(formData.get('year') as string) || new Date().getFullYear(),
        registration_number: formData.get('registrationNumber') as string,
        fuel_type: formData.get('fuelType') as string || 'Petrol',
        seating_capacity: parseInt(formData.get('seatingCapacity') as string) || 2,
        price_per_hour: parseFloat(formData.get('pricePerHour') as string) || undefined,
        price_per_day: parseFloat(formData.get('pricePerDay') as string) || 0,
        description: formData.get('description') as string || '',
        location: formData.get('location') as string || '',
        images: imageUrls,
      };
    } else {
      const body = await req.json();
      vehicleData = body;
    }

    if (!vendorId) {
      return NextResponse.json({ success: false, error: 'Vendor ID is required.' }, { status: 200 });
    }

    const result = await vehicleService.create(vendorId, vehicleData);

    if (result.success && result.data) {
      notificationService.notify({
        userId: vendorId,
        title: 'Vehicle Listed',
        message: `Your vehicle "${vehicleData.name}" has been listed successfully.`,
        type: 'success',
      }).catch(() => {});
    }

    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error('[API VEHICLES POST] Error:', err);
    return NextResponse.json({ success: false, error: 'Failed to add vehicle.' }, { status: 200 });
  }
}, 'vendor');
