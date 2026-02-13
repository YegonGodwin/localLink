import recommendationClient from '../utils/recommendationClient.js';
import Service from '../models/Service.model.js';
import Booking from '../models/Booking.model.js';

// Get recommended services for a user
export const getRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 10, model = 'hybrid' } = req.query;

    // Call recommendation service
    const recommendations = await recommendationClient.getServiceRecommendations(
      userId,
      parseInt(limit),
      model
    );

    // Fetch actual service details from database
    const serviceIds = recommendations.recommendations.map(r => r.service_id);
    const services = await Service.find({ _id: { $in: serviceIds } })
      .populate('provider', 'name email profileImage')
      .lean();

    // Merge recommendations with service details
    const enrichedRecommendations = recommendations.recommendations.map(rec => {
      const service = services.find(s => s._id.toString() === rec.service_id);
      return {
        ...service,
        recommendationScore: rec.score,
        recommendationReason: rec.reason
      };
    }).filter(r => r._id); // Filter out services that don't exist

    res.json({
      success: true,
      data: enrichedRecommendations,
      modelUsed: recommendations.model_used
    });
  } catch (error) {
    console.error('Error getting recommendations:', error);
    
    // Fallback to popular services if recommendation service fails
    const fallbackServices = await Service.find({ isActive: true })
      .sort({ bookingCount: -1 })
      .limit(parseInt(req.query.limit) || 10)
      .populate('provider', 'name email profileImage')
      .lean();

    res.json({
      success: true,
      data: fallbackServices,
      modelUsed: 'fallback',
      message: 'Using fallback recommendations'
    });
  }
};

// Get similar services
export const getSimilarServices = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const { limit = 10 } = req.query;

    // Verify service exists
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Call recommendation service
    const recommendations = await recommendationClient.getSimilarServices(
      serviceId,
      parseInt(limit)
    );

    // Fetch actual service details
    const serviceIds = recommendations.recommendations.map(r => r.service_id);
    const services = await Service.find({ 
      _id: { $in: serviceIds },
      isActive: true 
    })
      .populate('provider', 'name email profileImage')
      .lean();

    const enrichedRecommendations = recommendations.recommendations.map(rec => {
      const service = services.find(s => s._id.toString() === rec.service_id);
      return {
        ...service,
        similarityScore: rec.score
      };
    }).filter(r => r._id);

    res.json({
      success: true,
      data: enrichedRecommendations
    });
  } catch (error) {
    console.error('Error getting similar services:', error);
    
    // Fallback to same category services
    const service = await Service.findById(req.params.serviceId);
    const fallbackServices = await Service.find({
      category: service?.category,
      _id: { $ne: req.params.serviceId },
      isActive: true
    })
      .limit(parseInt(req.query.limit) || 10)
      .populate('provider', 'name email profileImage')
      .lean();

    res.json({
      success: true,
      data: fallbackServices,
      message: 'Using fallback similar services'
    });
  }
};

// Get personalized recommendations
export const getPersonalizedRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 10 } = req.query;

    // Call recommendation service
    const recommendations = await recommendationClient.getPersonalizedRecommendations(
      userId,
      parseInt(limit)
    );

    // Fetch actual service details
    const serviceIds = recommendations.recommendations.map(r => r.service_id);
    const services = await Service.find({ 
      _id: { $in: serviceIds },
      isActive: true 
    })
      .populate('provider', 'name email profileImage')
      .lean();

    const enrichedRecommendations = recommendations.recommendations.map(rec => {
      const service = services.find(s => s._id.toString() === rec.service_id);
      return {
        ...service,
        recommendationScore: rec.score
      };
    }).filter(r => r._id);

    res.json({
      success: true,
      data: enrichedRecommendations
    });
  } catch (error) {
    console.error('Error getting personalized recommendations:', error);
    
    // Fallback based on user's booking history
    const userBookings = await Booking.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('service');
    
    const bookedServices = await Service.find({
      _id: { $in: userBookings.map(b => b.service) }
    }).select('category');

    const categories = [...new Set(bookedServices.map(s => s.category))];
    
    const fallbackServices = await Service.find({
      category: { $in: categories },
      isActive: true
    })
      .limit(parseInt(req.query.limit) || 10)
      .populate('provider', 'name email profileImage')
      .lean();

    res.json({
      success: true,
      data: fallbackServices,
      message: 'Using fallback personalized recommendations'
    });
  }
};

// Health check for recommendation service
export const checkRecommendationServiceHealth = async (req, res) => {
  try {
    const health = await recommendationClient.healthCheck();
    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'Recommendation service unavailable',
      error: error.message
    });
  }
};
