'use strict';

/**
 * biography service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::biography.biography');
