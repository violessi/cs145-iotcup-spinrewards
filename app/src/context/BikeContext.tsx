import React, { createContext, useState, useContext, ReactNode } from "react";
import {
  createATrip,
  getRack,
  getAvailableBikes,
  getUserReservedTrip,
  deleteTrip,
  preRentCheck,
  handleReturn,
  hardwareRequest,
  payTrip,
} from "@/service/tripService";
import { listenToBikeStatus, listenToTrip } from "@/service/listeners";

import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "@/firebaseConfig";
import { set } from "zod";
import ErrorModal from "../components/ErrorModal";

type BikeContextType = {
  rackId: string;
  rackSlot: number | null;
  showSuccessModal: boolean;
  isLate: boolean;
  showErrorModal: boolean;
  showReturnModal: boolean;
  showRentModal: boolean;
  errorMessage: string;
  setShowErrorModal: React.Dispatch<React.SetStateAction<boolean>>;
  setShowSuccessModal: React.Dispatch<React.SetStateAction<boolean>>;
  setShowRentModal: React.Dispatch<React.SetStateAction<boolean>>;
  showLoadingModal: boolean;
  updateRackId: (newRackId: string) => void;
  rentABike: () => Promise<number | null>;
  reserveABike: (selectedDate: Date) => Promise<Bike | null>;
  returnABike: (userId: string) => Promise<void>;
  cancelReservation: (tripId: string) => void;
  payForTrip: (tripId: string, minusBalance: number) => Promise<void>;
  getRackNameById: (rackId: string) => Promise<string>;
  refreshTripsFlag: boolean;
  setRefreshTripsFlag: React.Dispatch<React.SetStateAction<boolean>>;
};

export const BikeContext = createContext<BikeContextType | null>(null);
const [showErrorModal, setShowErrorModal] = useState(false);
const [errorMessage, setErrorMessage] = useState("");

// PROVIDER COMPONENT
export const BikeProvider = ({ children }: { children: ReactNode }) => {
  const [rackId, setRackId] = useState("");
  const [rackSlot, setRackSlot] = useState<number | null>(null);

  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showRentModal, setShowRentModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLate, setIsLate] = useState(false);
  const [refreshTripsFlag, setRefreshTripsFlag] = useState(false);

  function updateRackId(newRackId: string) {
    setRackId(newRackId);
  }

  async function checkRackId() {
    try {
      const res = await getRack(rackId);
      return res;
    } catch (err) {
      return err;
    }
  }

  async function checkAvailableBikes(): Promise<Bike[]> {
    try {
      // server also checks for reservations that have expired
      // when getting available bikes
      const res = await getAvailableBikes(rackId);
      return res;
    } catch (err: any) {
      return err;
    }
  }

  async function initializeTrip(payload: CreateTrip) {
    try {
      const res = await createATrip(payload);
      return res;
    } catch (err) {
      console.error("Error:", err);
    }
  }

  async function checkReserved(userId: string, rackId: string) {
    try {
      const payload = {
        userId,
        rackId,
      };
      const reservedTrip = await getUserReservedTrip(payload);
      return reservedTrip;
    } catch (err) {
      console.error("Error in checkReserved:", err);
      return null;
    }
  }

  async function cancelTrip(payload: {
    bikeId: string;
    userId: string;
    tripId: string;
  }) {
    try {
      console.log(
        "Cancel params:",
        payload.bikeId,
        payload.userId,
        payload.tripId
      );
      const res = await deleteTrip(payload); // tripService function
      return res;
    } catch (err) {
      console.error("Error in cancelTrip:", err);
      throw err;
    }
  }

  async function getRackNameById(rackId: string): Promise<string> {
    if (!rackId) {
      return "";
    }

    try {
      const rackRef = doc(db, "racks", rackId);
      const rackSnap = await getDoc(rackRef);

      if (rackSnap.exists()) {
        const data = rackSnap.data();
        return data.rackName || rackId; // fallback to ID if name missing
      } else {
        return rackId;
      }
    } catch (error) {
      console.error("Error fetching rack:", error);
      return rackId;
    }
  }

  async function doPreRentCheck(userId: string) {
    try {
      const data = await preRentCheck(userId);
      return data;
    } catch (err) {
      console.error("Error in checkReserved:", err);
      return null;
    }
  }

  // ============ FULL RENT A BIKE FUNCTION ============
  async function rentABike() {
    const userId = "user123"; // PLACEHOLDER

    setShowLoadingModal(true);
    try {
      // check if rackId is valid
      const validRackId = await checkRackId();
      console.log("[CHECK Rent] Rack valid?", validRackId);

      if (Boolean(validRackId.message) === false) {
        throw new Error("Invalid rack ID");
      }

      // // handle prechecking before renting
      // const result = await doPreRentCheck(userId, rackId);
      // if (!result.allowed) {
      //   throw new Error(result.reason);
      // }

      // check if user has a reservation at this rack
      const reservedTripDoc = await checkReserved(userId, rackId);
      let bikeId: string;
      let reservedTripId: string | undefined;
      let slotToUse: number | null = null;

      console.log(reservedTripDoc);

      // IF user has a reserved trip at that rack, take bikeId of already assigned bike
      // ADD check if reservation is at that rack
      // Include reservedTripId in payload for CreateTrip
      if (reservedTripDoc && reservedTripDoc.status === "reserved") {
        bikeId = reservedTripDoc.bikeId;
        reservedTripId = reservedTripDoc.id;
        slotToUse = reservedTripDoc.rackSlot;
        setRackSlot(slotToUse);

        console.log("[APP] User has reserved: " + reservedTripId);
        console.log("[RENT] Using reserved bike:", bikeId);
      } else {
        // ELSE, check if there are available bikes
        const availableBikes = await checkAvailableBikes();
        console.log("[CHECK Rent] Available bikes:", availableBikes);

        if (!availableBikes || availableBikes.length === 0) {
          throw new Error("No available bikes found");
        }

        // randomly assign a bike to user
        const randomIndex = Math.floor(Math.random() * availableBikes.length);
        const bike = availableBikes[randomIndex];
        bikeId = bike.id;
        slotToUse = bike.rackSlot;
        setRackSlot(slotToUse);
      }

      const now = new Date();

      setShowLoadingModal(false);
      setTimeout(() => {
        setShowSuccessModal(true);
      }, 500);
      updateRackId("");

      slotToUse = await hardwareRequest({ bikeId });

      const payload: CreateTrip = {
        bikeId: bikeId,
        userId: "user123", // PLACEHOLDER
        status: "active",
        baseRate: 10,
        startTime: now.toISOString(),
        endTime: null,
        ...(reservedTripId && { reservedTripId }),
        paid: false,
        startRack: rackId,
        endRack: "",
      };

      await initializeTrip(payload);

      setShowSuccessModal(false);
      setTimeout(() => {
        setShowRentModal(true);
      }, 500);
      return slotToUse;
    } catch (err: any) {
      setShowLoadingModal(false);
      setShowSuccessModal(false);
      setTimeout(() => {
        setErrorMessage(err.message);
        setShowErrorModal(true);
      }, 500);
      return null;
    }
  }

  // ============ FULL RETURN A BIKE FUNCTION ============
  async function returnABike(userId: string) {
    setShowLoadingModal(true);

    try {
      setShowLoadingModal(false);
      setTimeout(() => {
        setShowReturnModal(true);
      }, 500);
      updateRackId("");
      const res = await handleReturn({ rackId, userId: "user123" }); // PLACEHOLDER
      console.log("Return response:", res);

      if (res.tripId) {
        const tripUnsub = listenToTrip(res.tripId, (tripData) => {
          if (tripData?.addtlFee !== undefined) {
            console.log("Additional fee detected:", tripData.addtlFee);
            setIsLate(tripData.addtlFee > 0);
            tripUnsub();
          }
        });
      }

      const unsub = listenToBikeStatus(res.bikeId, (status) => {
        if (status.toLowerCase() === "available") {
          unsub(); // stop listening when status is "available"

          setShowReturnModal(false);
          setTimeout(() => {
            setShowSuccessModal(true);
          }, 500);
        }
      });
    } catch (err: any) {
      setTimeout(() => {
        setShowLoadingModal(false);
        setShowReturnModal(false);
      }, 500);

      setTimeout(() => {
        setErrorMessage(err.message);
        setShowErrorModal(true);
      }, 1000);
    }
  }

  // ============ FULL RESERVE A BIKE FUNCTION ============
  async function reserveABike(selectedDate: Date) {
    setShowLoadingModal(true);

    try {
      const validRackId = await checkRackId();
      if (!validRackId.message) throw new Error("Invalid rack ID");

      const availableBikes = await checkAvailableBikes();
      if (!availableBikes || availableBikes.length === 0) {
        throw new Error("No available bikes"); // here
      }

      const randomIndex = Math.floor(Math.random() * availableBikes.length);
      const bike = availableBikes[randomIndex];

      const payload: CreateTrip = {
        bikeId: bike.id,
        userId: "user123", // PLACEHOLDER
        status: "reserved",
        baseRate: 10,
        startTime: selectedDate.toISOString(),
        endTime: null,
        paid: false,
        startRack: rackId,
        endRack: "",
      };

      await initializeTrip(payload);
      console.log("[RESERVE] Bike assigned:", bike.id);

      setShowLoadingModal(false);
      setShowSuccessModal(true);
      updateRackId("");

      return bike;
    } catch (err: any) {
      setShowLoadingModal(false);
      throw new Error(`Reservation failed: ${err.message}`);
    }
  }

  // ============ FULL CANCEL A BIKE FUNCTION ============
  async function cancelReservation(tripId: string) {
    setShowLoadingModal(true);

    try {
      // get reserved trip data
      console.log("Cancelling", tripId);
      const tripRef = doc(db, "trips", tripId);
      const tripSnap = await getDoc(tripRef);

      if (!tripSnap.exists()) {
        throw new Error("Trip not found");
      }

      const tripData = tripSnap.data();
      if (!tripData) {
        throw new Error("Trip data is undefined");
      }

      if (tripData.status !== "reserved") {
        throw new Error("Trip is not reserved");
      }

      const payload = {
        bikeId: tripData.bikeId, // get assigned bike from reservation,
        userId: "user123", // PLACEHOLDER
        tripId,
      };

      await cancelTrip(payload); // post failed
      console.log("[CANCEL] Cancel trip:", tripId);

      setShowLoadingModal(false);
      setShowSuccessModal(true);
      updateRackId("");
    } catch (err: any) {
      setShowLoadingModal(false);
      setTimeout(() => {
        setErrorMessage(err.message);
        setShowErrorModal(true);
      }, 500);
    }
  }

  // ============ FULL PAY FUNCTION ============
  async function payForTrip(tripId: string, minusBalance: number) {
    setShowLoadingModal(true);

    try {
      console.log("Paying for", tripId);
      // set parameters/payload (tripid, minusbalance)
      // call function from tripService
      const res = await payTrip(tripId, minusBalance);
      setShowLoadingModal(false);
      // that will handle server posts/functions
      // await and store response, return response as success
      // console.log("Payment successful:", response);
    } catch (err: any) {
      setShowLoadingModal(false);
      throw new Error(`Payment failed: ${err.message}`);
    }
  }

  return (
    <BikeContext.Provider
      value={{
        rackId,
        rackSlot,
        showSuccessModal,
        showErrorModal,
        isLate,
        showReturnModal,
        showRentModal,
        errorMessage,
        setShowErrorModal,
        setShowSuccessModal,
        setShowRentModal,
        showLoadingModal,
        updateRackId,
        rentABike,
        reserveABike,
        returnABike,
        cancelReservation,
        payForTrip,
        getRackNameById,
        refreshTripsFlag,
        setRefreshTripsFlag,
      }}
    >
      {children}
      <ErrorModal
        title="Error"
        description={errorMessage}
        showErrorModal={showErrorModal}
        onClose={() => setShowErrorModal(false)}
      />
    </BikeContext.Provider>
  );
};

export const useBike = () => {
  const context = useContext(BikeContext);
  if (!context) {
    throw new Error("useBikeContext must be used within an AppProvider");
  }
  return context;
};
