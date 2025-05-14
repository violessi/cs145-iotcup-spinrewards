const express = require("express");
const { admin, db } = require("../firebaseAdmin");

const router = express.Router();
router.use(express.json());

// POST /api/action/avail
// make a new trip with intial fields first
router.post("/avail", async (req, res) => {
  try {
    // check first if they have a reserved bike at the rack theyre availing from

    const newTrip = {
      bike_id: "bike" + Math.floor(Math.random() * 100),
      user_id: "user123",
      start_time: new Date(),
      status: "active",
      base_rate: 10,
      // created_at - new if not reserved
    };

    await db.collection("trips").add(newTrip);
    res.status(200).json({ message: "[SERVER] Bike availed!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "[SERVER] Failed to avail bike" });
  }
});

// POST /api/action/return
// update trip
router.post("/return", async (req, res) => {
  try {
    const snapshot = await db
      .collection("trips")
      .where("status", "==", "active")
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({ error: "[SERVER] No active trips found" });
    }

    const tripDoc = snapshot.docs[0];
    const tripRef = db.collection("trips").doc(tripDoc.id);

    await tripRef.update({
      end_time: new Date(),
      status: "completed", 
      // addtl_charge if meron
      // final_fee computed
      updated_at: new Date(),
    });

    res.status(200).json({ message: "[SERVER] Bike returned!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "[SERVER] Failed to return bike" });
  }
});

// POST /api/bikeActions/reserve
router.post("/reserve", async (req, res) => {
  try {
    const { rack, date, time } = req.body;
    const reservationStart = date && time ? new Date(`${date}T${time}:00`) : new Date();

    const newTrip = {
      bike_id: "bike" + Math.floor(Math.random() * 100), // temp: generate bike_id
      user_id: "user123", // temp: all user123 first
      start_time: reservationStart,
      status: "reserved",
      created_at: new Date(),
      start_rack: rack, // takes current rack page they're on
    };

    await db.collection("trips").add(newTrip);
    res.status(200).json({ message: "[SERVER] Bike reserved!" });
  } catch (err) {
    res.status(500).json({ error: "[SERVER] Failed to reserve bike" });
  }
});

// POST /api/bikeActions/cancel
router.post("/cancel", async (req, res) => {
  const { tripID } = req.body;
  if (!tripID) return res.status(400).json({ error: "[SERVER] Missing tripID" });

  try {
    await db.collection("trips").doc(tripID).delete();
    res.status(200).json({ message: "[SERVER] Trip deleted." });
  } catch (err) {
    res.status(500).json({ error: "[SERVER] Failed to delete trip" });
  }
});

module.exports = router;