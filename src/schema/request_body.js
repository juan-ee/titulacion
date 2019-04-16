const joi = require('joi');

module.exports = {
    body: {
        totalDays: joi.number().integer().positive().min(1).required(),
        startDate: joi.date().required(),
        location: {
            lat: joi.number().required(),
            lng: joi.number().required(),
        },
        travelSchedule: {
            start: joi.string().regex(/^[0-9]{4}$/).required(),
            end: joi.string().regex(/[0-9]{4}/).required(),
        },
        lunchTime: {
            start: joi.string().regex(/[0-9]{4}/).required(),
            end: joi.string().regex(/[0-9]{4}/).required(),
        },
        categories: joi.array().items(joi.string())
    }
};