import Service from "../models/Service.model.js";

// @desc    Get all services
// @route   GET /api/services
// @access  Public
export const getServices = async (req, res) => {
    const services = await Service.find({}).populate("provider", "name avatar");
    res.json(services);
};

// @desc    Get service by ID
// @route   GET /api/services/:id
// @access  Public
export const getServiceById = async (req, res) => {
    const service = await Service.findById(req.params.id).populate("provider", "name avatar");

    if (service) {
        res.json(service);
    } else {
        res.status(404);
        throw new Error("Service not found");
    }
};

// @desc    Create a service
// @route   POST /api/services
// @access  Private/Provider
export const createService = async (req, res) => {
    const { title, description, category, price, image } = req.body;

    const service = new Service({
        provider: req.user._id,
        title,
        description,
        category,
        price,
        image,
    });

    const createdService = await service.save();
    res.status(201).json(createdService);
};

// @desc    Update a service
// @route   PUT /api/services/:id
// @access  Private/Provider
export const updateService = async (req, res) => {
    const { title, description, category, price, image } = req.body;

    const service = await Service.findById(req.params.id);

    if (service) {
        if (service.provider.toString() !== req.user._id.toString()) {
            res.status(401);
            throw new Error("User not authorized to update this service");
        }

        service.title = title || service.title;
        service.description = description || service.description;
        service.category = category || service.category;
        service.price = price || service.price;
        service.image = image || service.image;

        const updatedService = await service.save();
        res.json(updatedService);
    } else {
        res.status(404);
        throw new Error("Service not found");
    }
};

// @desc    Delete a service
// @route   DELETE /api/services/:id
// @access  Private/Provider
export const deleteService = async (req, res) => {
    const service = await Service.findById(req.params.id);

    if (service) {
        if (service.provider.toString() !== req.user._id.toString()) {
            res.status(401);
            throw new Error("User not authorized to delete this service");
        }

        await service.deleteOne();
        res.json({ message: "Service removed" });
    } else {
        res.status(404);
        throw new Error("Service not found");
    }
};

// @desc    Get services by provider
// @route   GET /api/services/provider/:id
// @access  Public
export const getServicesByProvider = async (req, res) => {
    const services = await Service.find({ provider: req.params.id });
    res.json(services);
};
