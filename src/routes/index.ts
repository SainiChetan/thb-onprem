

import express = require('express');

let router = (express as any).Router();

const asyncMiddleware = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next))
        .catch(next);
};

const test = async (req, res, next) => {
    res.send(' test CHECK RUNNING ');
}

router.get('/', asyncMiddleware(test));

export = router;