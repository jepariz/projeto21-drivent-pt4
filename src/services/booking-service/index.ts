import { cannotBooking, notFoundError } from "@/errors";
import bookingRepository from "@/repositories/booking-repository";
import enrollmentRepository from "@/repositories/enrollment-repository";
import ticketRepository from "@/repositories/ticket-repository";


async function createBooking(userId: number, roomId: number) {
    const enrollment = await enrollmentRepository.findWithAddressByUserId(userId);
    
    if (!enrollment) throw notFoundError();

    const ticket = await ticketRepository.findTicketByEnrollmentId(enrollment.id);
  
    if (!ticket || ticket.status === "RESERVED" || ticket.TicketType.isRemote || !ticket.TicketType.includesHotel) {
        throw cannotBooking();
      }

    const roomExists = await bookingRepository.findRoom(roomId)

    if(!roomExists) throw notFoundError();

    if(roomExists.capacity === 0) throw cannotBooking();
   
    const booking = await bookingRepository.insertBooking(userId,roomId )
    return booking;
  }


  async function getBooking(userId:number) {
    const bookingExists = await bookingRepository.findBooking(userId)

    if(!bookingExists) throw notFoundError();
  }


async function updateBooking(userId: number, roomId: number, bookingId: number) {

  await getBooking(userId) 

  const roomExists = await bookingRepository.findRoom(roomId)

  if(!roomExists) throw notFoundError();

  if(roomExists.capacity === 0) throw cannotBooking();

  if(roomExists.capacity > 0){
    const updateBooking = await bookingRepository.updateBooking(bookingId,roomId )
    return updateBooking;
  }
  
}


  const bookingService = {
    createBooking,
    getBooking,
    updateBooking
  };



  
  export default bookingService;