import { Debater, Match,Adjudicator } from "./models.js";

// 1. Get all debaters
export const getAllDebaters = async (req, res) => {
  try {
    const debaters = await Debater.find().sort({ rating: -1 });
    res.status(200).json(debaters);
  } catch (error) {
    console.error("Get all debaters error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// 2. Create a new debater
export const createDebater = async (req, res) => {
  try {
    const { name, rating } = req.body;
    const newDebater = new Debater({ name, rating });
    await newDebater.save();
    res.status(201).json(newDebater);
  } catch (error) {
    console.error("Create debater error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// 3. Get single debater by ID
export const getDebaterById = async (req, res) => {
  try {
    const debater = await Debater.findById(req.params.id);
    if (!debater) return res.status(404).json({ error: "Debater not found" });
    res.status(200).json(debater);
  } catch (error) {
    console.error("Get debater by ID error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// 4. Update debater by ID
export const updateDebater = async (req, res) => {
  try {
    const updatedDebater = await Debater.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedDebater) return res.status(404).json({ error: "Debater not found" });
    res.status(200).json(updatedDebater);
  } catch (error) {
    console.error("Update debater error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// 5. Delete debater by ID
export const deleteDebater = async (req, res) => {
  try {
    const deletedDebater = await Debater.findByIdAndDelete(req.params.id);
    if (!deletedDebater) return res.status(404).json({ error: "Debater not found" });
    res.status(200).json({ message: "Debater deleted" });
  } catch (error) {
    console.error("Delete debater error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// 6. Submit match results
export const submitMatchResult = async (req, res) => {
  try {
    const { govTeam, oppTeam, verdict } = req.body;

    if (!govTeam || !oppTeam || !verdict) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const K = 20;
    const govIds = govTeam.map(d => d.debaterId);
    const oppIds = oppTeam.map(d => d.debaterId);

    const govDebaters = await Debater.find({ _id: { $in: govIds } });
    const oppDebaters = await Debater.find({ _id: { $in: oppIds } });

    const govAvg = govDebaters.reduce((sum, d) => sum + d.rating, 0) / govTeam.length;
    const oppAvg = oppDebaters.reduce((sum, d) => sum + d.rating, 0) / oppTeam.length;

    const updates = [];
    
    govDebaters.forEach((debater, i) => {
      const expected = 1 / (1 + 10 ** ((oppAvg - debater.rating) / 400));
      const scoreDiff = govTeam[i].score - 75;
      const newRating = Math.round(debater.rating + K * ((verdict === 'gov' ? 1 : 0) - expected) + scoreDiff * 0.3);
      updates.push({ debater, newRating });
    });

    oppDebaters.forEach((debater, i) => {
      const expected = 1 / (1 + 10 ** ((govAvg - debater.rating) / 400));
      const scoreDiff = oppTeam[i].score - 75;
      const newRating = Math.round(debater.rating + K * ((verdict === 'opp' ? 1 : 0) - expected) + scoreDiff * 0.3);
      updates.push({ debater, newRating });
    });

    await Promise.all(
      updates.map(({ debater, newRating }) => 
        Debater.updateOne({ _id: debater._id }, { rating: newRating })
      )
    );

    await new Match({ govTeam, oppTeam, verdict }).save();
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =============== Adjudicator Controllers ===============

// 1. Get all adjudicators
export const getAllAdjudicators = async (req, res) => {
  try {
    // Sort by rating descending
    const adjudicators = await Adjudicator.find().sort({ rating: -1 });
    res.status(200).json(adjudicators);
  } catch (error) {
    console.error("Get all adjudicators error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// 2. Create a new adjudicator
export const createAdjudicator = async (req, res) => {
  try {
    const { name, rating, verdictAccuracy, feedbackScore } = req.body;
    const newAdjudicator = new Adjudicator({ name, rating, verdictAccuracy, feedbackScore });
    await newAdjudicator.save();
    res.status(201).json(newAdjudicator);
  } catch (error) {
    console.error("Create adjudicator error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// 3. Get single adjudicator by ID
export const getAdjudicatorById = async (req, res) => {
  try {
    const adjudicator = await Adjudicator.findById(req.params.id);
    if (!adjudicator) return res.status(404).json({ error: "Adjudicator not found" });
    res.status(200).json(adjudicator);
  } catch (error) {
    console.error("Get adjudicator by ID error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// 4. Update adjudicator by ID
export const updateAdjudicator = async (req, res) => {
  try {
    const updates = req.body;
    const updatedAdjudicator = await Adjudicator.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    );
    if (!updatedAdjudicator) return res.status(404).json({ error: "Adjudicator not found" });
    res.status(200).json(updatedAdjudicator);
  } catch (error) {
    console.error("Update adjudicator error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// 5. Delete adjudicator by ID
export const deleteAdjudicator = async (req, res) => {
  try {
    const deletedAdjudicator = await Adjudicator.findByIdAndDelete(req.params.id);
    if (!deletedAdjudicator) return res.status(404).json({ error: "Adjudicator not found" });
    res.status(200).json({ message: "Adjudicator deleted" });
  } catch (error) {
    console.error("Delete adjudicator error:", error);
    res.status(500).json({ error: "Server error" });
  }
};
