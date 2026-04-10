"use strict"

import Joi from "joi";

const register = {
    body: Joi.object({
        username: Joi.string().alphanum().min(3).max(30).required(),
        password: Joi.string().min(6).required(),
    }),
};

const login = {
    body: Joi.object({
        username: Joi.string().required(),
        password: Joi.string().required(),
    }),
};

const refresh = {
    body: Joi.object({
        refreshToken: Joi.string().required(),
    }),
};

const emptyBody = Joi.object({});

export default { register, login, refresh, emptyBody };
