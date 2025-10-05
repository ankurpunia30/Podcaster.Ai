// Input validation middleware
export const validateRegistration = (req, res, next) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }
  
  // Password validation
  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long' });
  }
  
  next();
};

export const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  
  next();
};

export const validatePodcastGeneration = (req, res, next) => {
  const { topic } = req.body;
  
  if (!topic || typeof topic !== 'string' || topic.trim().length < 5) {
    return res.status(400).json({ message: 'Topic must be at least 5 characters long' });
  }
  
  if (topic.length > 500) {
    return res.status(400).json({ message: 'Topic must be less than 500 characters' });
  }
  
  // Sanitize topic
  req.body.topic = topic.trim();
  
  next();
};
