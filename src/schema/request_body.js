const joi = require('joi');

module.exports = {
    body: {
        totalDays: joi.number().integer().positive().min(1).required(),
        location: joi.object().keys({
            lat: joi.number().required(),
            lng: joi.number().required(),
        }).required(),
        categories: joi.array().items(joi.string()),
        startDate: joi.date().required(),
        travelSchedule: joi.object().keys({
            start: joi.string().regex(/^[0-9]{4}$/).required(),
            end: joi.string().regex(/[0-9]{4}/).required(),
        }).default({
            start: "0900",
            end: "1830"
        }),
        lunchTime: joi.object().keys({
            start: joi.string().regex(/[0-9]{4}/).required(),
            end: joi.string().regex(/[0-9]{4}/).required(),
        }).default({
            start: "1300",
            end: "1400"
        })
    }
};