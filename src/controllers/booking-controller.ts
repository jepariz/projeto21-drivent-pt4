import { AuthenticatedRequest } from "@/middlewares";
import bookingService from "@/services/booking-service";
import ticketService from "@/services/tickets-service";
import { Response } from "express";
import httpStatus from "http-status";


export async function postBooking(req: AuthenticatedRequest, res: Response) {
    const { userId } = req;
    const roomId = req.body.roomId
  
    try {
      const booking = await bookingService.createBooking(userId, roomId);
      return res.status(httpStatus.OK).send(booking.id);
    } catch (error) {
        if (error.name === "NotFoundError") {
          return res.sendStatus(httpStatus.NOT_FOUND);
        }
        if (error.name === "CannotBooking") {
          return res.sendStatus(httpStatus.FORBIDDEN);
        }
        return res.sendStatus(httpStatus.BAD_REQUEST);
      }
  }

export async function getBooking(req: AuthenticatedRequest, res: Response) {
    const { userId } = req;
  
    try {
      const booking = await bookingService.getBooking(userId);
      return res.status(httpStatus.OK).send(booking);
    } catch (error) {
        if (error.name === "NotFoundError") {
            return res.sendStatus(httpStatus.NOT_FOUND);
          }
          return res.sendStatus(httpStatus.BAD_REQUEST);
    }
  }


  export async function updateBooking(req: AuthenticatedRequest, res: Response) {
    const { userId } = req;
    const roomId = req.body.roomId
    const bookingId = Number(req.params.bookingId)
  
    try {
      const booking = await bookingService.updateBooking(userId, roomId, bookingId);
      return res.status(httpStatus.OK).send(booking.id);
    } catch (error) {
        if (error.name === "NotFoundError") {
          return res.sendStatus(httpStatus.NOT_FOUND);
        }
        if (error.name === "CannotBooking") {
          return res.sendStatus(httpStatus.FORBIDDEN);
        }
        return res.sendStatus(httpStatus.BAD_REQUEST);
      }
  }