import { VisitorParkingAssignmentStatus } from "../../modules/parking/parking.interface.js"
import { VisitorParkingAssignmentModel } from "../../modules/parking/parking.model.js"
import { AppError } from "../AppError.js"
import { releaseSecurityVisitorParkingSlot } from "../security-visitor-parking.js"

type ReleasedParkingAssignment = {
  assignmentId: string
  slotId: string
}

export const releaseActiveParkingForVisit = async ({
  apartmentId,
  userId,
  visitId,
  releasedAt,
}: {
  apartmentId: string
  userId: string
  visitId: string
  releasedAt: Date
}): Promise<ReleasedParkingAssignment | null> => {
  const assignment =
    await VisitorParkingAssignmentModel.findOneAndUpdate(
      {
        apartmentId,
        visitorVisitId: visitId,
        status: VisitorParkingAssignmentStatus.ACTIVE,
      },
      {
        $set: {
          status: VisitorParkingAssignmentStatus.RELEASED,
          releasedBy: userId,
          releasedAt,
        },
      },
      { new: true }
    )

  if (!assignment) return null

  const slotReleased = await releaseSecurityVisitorParkingSlot(
    apartmentId,
    assignment.slotId.toString()
  )

  if (!slotReleased) {
    await VisitorParkingAssignmentModel.updateOne(
      {
        _id: assignment._id,
        apartmentId,
      },
      {
        $set: {
          status: VisitorParkingAssignmentStatus.ACTIVE,
          releasedBy: null,
          releasedAt: null,
        },
      }
    )

    throw new AppError(
      "Unable to release visitor parking slot",
      500
    )
  }

  return {
    assignmentId: assignment._id.toString(),
    slotId: assignment.slotId.toString(),
  }
}
