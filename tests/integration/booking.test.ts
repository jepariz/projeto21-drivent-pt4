import app, { init } from "@/app";
import faker from "@faker-js/faker";
import { Prisma, prisma, TicketStatus } from "@prisma/client";
import httpStatus from "http-status";
import * as jwt from "jsonwebtoken";
import supertest from "supertest";
import { createBooking, createEnrollmentWithAddress, createHotel, createPayment, createRoomWithHotelId, createRoomWithoutCapacity, createTicket, createTicketTypeRemote, createTicketTypeWithHotel, createTicketTypeWithoutHotel, createUser, findBooking } from "../factories";
import { cleanDb, generateValidToken } from "../helpers";


beforeAll(async () => {
    await init();
  });
  
  beforeEach(async () => {
    await cleanDb();
  });
  
  const server = supertest(app);

  describe("GET /booking", () => {
    it("should respond with status 401 if no token is given", async () => {
      const response = await server.get("/booking");
  
      expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });
  
    it("should respond with status 401 if given token is not valid", async () => {
      const token = faker.lorem.word();
  
      const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);
  
      expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });
  
    it("should respond with status 401 if there is no session for given token", async () => {
      const userWithoutSession = await createUser();
      const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);
  
      const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);
  
      expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });
  
    describe("when token is valid", () => {

    it("should respond with status 404 when user doesnt have a booking ", async () => {
    const user = await createUser();
    const token = await generateValidToken(user);
    const enrollment = await createEnrollmentWithAddress(user);
    const ticketType = await createTicketTypeWithHotel();
    const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
    const payment = await createPayment(ticket.id, ticketType.price);


    const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);

    expect(response.status).toEqual(httpStatus.NOT_FOUND);
    });
  
    it("should respond with status 200 and booking data", async () => {
    const user = await createUser();
    const token = await generateValidToken(user);
    const enrollment = await createEnrollmentWithAddress(user);
    const ticketType = await createTicketTypeWithHotel();
    const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
    const payment = await createPayment(ticket.id, ticketType.price);
    const createdHotel = await createHotel();
    const createdRoom = await createRoomWithHotelId(createdHotel.id);
    const createNewBooking = await createBooking(createdRoom.id, user.id)

    const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);
    

    expect(response.status).toEqual(httpStatus.OK);
    expect(response.body).toEqual(
        {
        id: createNewBooking.id,
        Room: {
        id: createdRoom.id,
        name: createdRoom.name,
        capacity: createdRoom.capacity,
        hotelId: createdRoom.hotelId,
        createdAt: createdRoom.createdAt.toISOString(),
        updatedAt: createdRoom.updatedAt.toISOString(),
        }
        })
    });
});
  });

  describe("POST /booking", () => {
    it("should respond with status 401 if no token is given", async () => {
        const response = await server.post("/booking");
    
        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
      });
    
      it("should respond with status 401 if given token is not valid", async () => {
        const token = faker.lorem.word();
    
        const response = await server.post("/booking").set("Authorization", `Bearer ${token}`);
    
        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
      });
    
      it("should respond with status 401 if there is no session for given token", async () => {
        const userWithoutSession = await createUser();
        const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);
    
        const response = await server.post("/booking").set("Authorization", `Bearer ${token}`);
    
        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
      });
    
      describe("when token is valid", () => {
        
      it("should respond with status 403 when user ticket is remote", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeRemote();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
     
      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({ roomId: 1 });
  
      expect(response.status).toEqual(httpStatus.FORBIDDEN);
      });
        
      it("should respond with status 403 when ticket is not PAID", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);
  
      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({ roomId: 1 });
  
      expect(response.status).toBe(httpStatus.FORBIDDEN);
      });
        
      it("should respond with status 403 when ticketType includesHotel is false", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithoutHotel();
      await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
  
      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({ roomId: 1 });
  
      expect(response.status).toBe(httpStatus.FORBIDDEN);
      });

      it("should respond with status 404 when room doesnt exist ", async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createTicketTypeWithHotel();
        const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
        const payment = await createPayment(ticket.id, ticketType.price);

        const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({ roomId: 1 });
    
        expect(response.status).toEqual(httpStatus.NOT_FOUND);
        });
    
     it("should respond with status 403 when room capacity is over ", async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createTicketTypeWithHotel();
        const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
        const payment = await createPayment(ticket.id, ticketType.price);
        const createdHotel = await createHotel();
        const createdRoom = await createRoomWithoutCapacity(createdHotel.id);

        const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({ roomId: createdRoom.id });
    
        expect(response.status).toEqual(httpStatus.FORBIDDEN);
        });

    it("should respond with status 200 and booking id", async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const enrollment = await createEnrollmentWithAddress(user);
            const ticketType = await createTicketTypeWithHotel();
            const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
            const payment = await createPayment(ticket.id, ticketType.price);
            const createdHotel = await createHotel();
            const createdRoom = await createRoomWithHotelId(createdHotel.id);
           
        
            const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({ roomId: createdRoom.id });
            
            let id;
            const bookingWasCreated = await findBooking()
            const bookingId = bookingWasCreated.map((b) => {
                id = b.id
            })

            expect(response.status).toEqual(httpStatus.OK);
            expect(response.body).toEqual({ bookingId: id })
           
        })
    })
  })

  describe("PUT /booking", () => {
    it("should respond with status 401 if no token is given", async () => {
        const response = await server.put("/booking/1");
    
        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
      });
    
      it("should respond with status 401 if given token is not valid", async () => {
        const token = faker.lorem.word();
    
        const response = await server.put("/booking/1").set("Authorization", `Bearer ${token}`);
    
        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
      });
    
      it("should respond with status 401 if there is no session for given token", async () => {
        const userWithoutSession = await createUser();
        const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);
    
        const response = await server.put("/booking/1").set("Authorization", `Bearer ${token}`);
    
        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
      });
    
      describe("when token is valid", () => {

      it("should respond with status 404 when room doesnt exist ", async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createTicketTypeWithHotel();
        const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
        const payment = await createPayment(ticket.id, ticketType.price);
        const createdHotel = await createHotel();
        const createdRoom = await createRoomWithHotelId(createdHotel.id);
        const createdBooking = await createBooking(createdRoom.id, user.id)

        const response = await server.put(`/booking/${createdBooking.id}`).set("Authorization", `Bearer ${token}`).send({ roomId: 1});
    
        expect(response.status).toEqual(httpStatus.NOT_FOUND);
        });
    
     it("should respond with status 403 when room capacity is over ", async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createTicketTypeWithHotel();
        const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
        const payment = await createPayment(ticket.id, ticketType.price);
        const createdHotel = await createHotel();
        const createdRoom = await createRoomWithHotelId(createdHotel.id);
        const createdBooking = await createBooking(createdRoom.id, user.id)
           
        const newRoom = await createRoomWithoutCapacity(createdHotel.id);
    
        const response = await server.put(`/booking/${createdBooking.id}`).set("Authorization", `Bearer ${token}`).send({ roomId: newRoom.id });
    
        expect(response.status).toEqual(httpStatus.FORBIDDEN);
        });

     it("should respond with status 403 when user has no previous booking ", async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const enrollment = await createEnrollmentWithAddress(user);
            const ticketType = await createTicketTypeWithHotel();
            const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
            const payment = await createPayment(ticket.id, ticketType.price);
            const createdHotel = await createHotel();
            const createdRoom = await createRoomWithHotelId(createdHotel.id);
      
            const response = await server.put("/booking/1").set("Authorization", `Bearer ${token}`).send({ roomId: createdRoom.id });
        
            expect(response.status).toEqual(httpStatus.FORBIDDEN);
            });

    it("should respond with status 200 and booking id", async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const enrollment = await createEnrollmentWithAddress(user);
            const ticketType = await createTicketTypeWithHotel();
            const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
            const payment = await createPayment(ticket.id, ticketType.price);
            const createdHotel = await createHotel();
            const createdRoom = await createRoomWithHotelId(createdHotel.id);
            const createdBooking = await createBooking(createdRoom.id, user.id)
           
            const newRoom = await createRoomWithHotelId(createdHotel.id);
        
            const response = await server.put(`/booking/${createdBooking.id}`).set("Authorization", `Bearer ${token}`).send({ roomId: newRoom.id });
        
            let id;
            const bookingWasCreated = await findBooking()
            const bookingId = bookingWasCreated.map((b) => {
                id = b.id
            })


            expect(response.status).toEqual(httpStatus.OK);
            expect(response.body).toEqual({ bookingId: id })
           
        })
    })
  })