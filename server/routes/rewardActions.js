const express = require("express");
const { admin, db } = require("../firebaseAdmin");

const router = express.Router();
router.use(express.json());

router.post("/claim", async (req, res) => {
  const { userId, rewardId } = req.body;

  if (!userId || !rewardId) {
    return res.status(400).json({ error: 'Missing userId or rewardId' });
  }

  try {
    // get reward details
    const rewardRef = db.collection('rewards').doc(rewardId);
    const rewardSnap = await rewardRef.get();
    if (!rewardSnap.exists) return res.status(404).json({ error: 'Reward not found' });

    const reward = rewardSnap.data();
    const reqs = reward.reqs || [];

    // get user doc
    const userRef = db.collection('users').doc(userId);
    const userSnap = await userRef.get();
    if (!userSnap.exists) return res.status(404).json({ error: 'User not found' });

    // get user trips
    const tripSnaps = await db
    .collection('trips')
    .where('user_id', '==', userId)
    .where('status', '==', 'completed')
    .get();

    const trips = tripSnaps.docs.map(doc => doc.data());

    // check if requirements satisfied
    const allReqsMet = trips.some(trip => {
      const endTime = trip.end_time.toDate?.();
      const hour = endTime?.getHours(); // 0–23
      const day = endTime?.toLocaleString('en-US', { weekday: 'long' });
      
      // console.log(trip.end_rack, {endTime, hour, day});
      
      return reqs.every(req =>
        trip.end_rack === req ||
        (hour >= 16 && hour < 20 && req === "4PM to 8PM") || // figure out how to check time
        (day === req)
      );
    });

    if (!allReqsMet) {
      return res.status(403).json({ error: '[SERVER] Requirements not met' });
    }

    // if met, update doc
    await userRef.update({
      rewards: admin.firestore.FieldValue.arrayUnion(rewardId)
    });

    res.status(200).json({ message: "[SERVER] Reward claimed!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "[SERVER] Failed to claim reward" });
  }
});

module.exports = router;