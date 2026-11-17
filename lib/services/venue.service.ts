import { connectDB } from "@/lib/db/connect";
import { VenueConfigModel } from "@/lib/db/models/VenueConfig";
import {
  updateVenueConfigSchema,
  type UpdateVenueConfigInput,
} from "@/lib/validations/venue.schema";

export async function getVenueConfig() {
  await connectDB();

  return VenueConfigModel.findOneAndUpdate(
    { singletonKey: "MAIN_VENUE" },
    {
      $setOnInsert: {
        singletonKey: "MAIN_VENUE",
        name: "Mi Complejo de Fútbol",
        slotDurationMinutes: 60,
        depositPercentage: 30,
        operatingHours: [],
      },
    },
    { new: true, upsert: true, runValidators: true },
  );
}

export async function updateVenueConfig(
  input: UpdateVenueConfigInput,
) {
  const validatedData = updateVenueConfigSchema.parse(input);

  await connectDB();

  const updated = await VenueConfigModel.findOneAndUpdate(
    { singletonKey: "MAIN_VENUE" },
    { $set: validatedData },
    { new: true, upsert: true, runValidators: true },
  );

  return updated;
}
