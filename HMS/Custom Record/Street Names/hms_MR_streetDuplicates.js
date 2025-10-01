/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

/**
 * File name: hms_MR_streetDuplicates.js
 * Script: HMS | MR Street Duplicates
 * Author           Date       Version               Remarks
 * nagendrababu   09.30.2025    1.00      Initial creation of script.
 *
 */

/* -------------------------- Script Usage - Begin -------------------------- */

/* -------------------------- Script Usage - End -------------------------- */

/* global define,log*/

define(['N/search', 'N/record'], (search, record) => {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* ------------------------- Get Input Data - Begin ------------------------- */
  /**
   * Get Input Data
   * @returns {Object}
   */
  const getInputData = () => {
    const loggerTitle = 'getInputData';
    log.debug(loggerTitle, 'Fetching duplicate streets via saved search');

    // 🔎 Saved Search: Summary search to identify duplicate streets
    return search.create({
      type: 'customrecord_street_name',
      filters: [
        ['custrecord_subdivision.internalidnumber', 'equalto', '2712'],
        'AND',
        ['custrecord_hsm_primary_street', 'is', 'F'], // not primary
        'AND',
        ['count(internalid)', 'greaterthan', '1'], // duplicates only
      ],
      columns: [
        search.createColumn({
          name: 'custrecord_subdivision',
          summary: search.Summary.GROUP,
          label: 'Subdivision',
        }),
        search.createColumn({
          name: 'name',
          summary: search.Summary.GROUP,
          label: 'Street Name',
        }),
        search.createColumn({
          name: 'internalid',
          summary: search.Summary.COUNT,
          label: 'Count',
        }),
      ],
    });
  };
  /* ------------------------- Get Input Data - End ------------------------- */
  //
  /* ---------------------------- Map Phase - Begin --------------------------- */
  /**
   *
   * @param {object} mapContext
   */
  const map = (mapContext) => {
    const loggerTitle = 'Map Phase';
    log.audit(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    //
    try {
      //
      const result = JSON.parse(mapContext.value);
      log.debug(loggerTitle, result);

      const subdivisionId =
        result.values['GROUP(custrecord_subdivision)'].value;
      const streetName = result.values['GROUP(name)'];

      const key = `${subdivisionId}::${streetName}`;
      log.debug(loggerTitle, `Key: ${key}`);
      //
      mapContext.write({ key, value: { subdivisionId, streetName } });
      //
    } catch (error) {
      log.error(loggerTitle + ' caught an exception', error);
    }
    //
    log.audit(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
    );
  };
  /* ----------------------------- Map Phase - End ---------------------------- */
  //
  /* -------------------------- Reduce Phase - Begin -------------------------- */
  /**
   * Processes duplicate street records for a subdivision and street name.
   * @param {object} reduceContext
   */
  const reduce = (reduceContext) => {
    const loggerTitle = 'Reduce Phase';
    log.audit(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    //
    try {
      const { subdivisionId, streetName } = JSON.parse(reduceContext.values[0]);
      log.audit(
        loggerTitle,
        `Processing Subdivision: ${subdivisionId}, Street: ${streetName}`
      );

      // 1. Get all street records for subdivision + streetName
      const streetIds = getStreetIds(subdivisionId, streetName);
      log.debug(loggerTitle, `Street IDs found: ${JSON.stringify(streetIds)}`);

      if (streetIds.length <= 1) {
        log.debug(loggerTitle, 'No duplicates found, skipping.');
        return;
      }

      // 2. Sort street IDs to select the lowest ID as primary
      streetIds.sort((a, b) => a - b);
      const primaryStreetId = streetIds[0];
      const duplicateStreetIds = streetIds.slice(1);

      // 3. Mark the primary street
      if (!markAsPrimary(primaryStreetId)) {
        log.error(
          loggerTitle,
          `Failed to mark street ID ${primaryStreetId} as primary.`
        );
        return;
      }

      // 4. Get property records for duplicate streets and update to primary
      let allPropertyIds = [];
      duplicateStreetIds.forEach((sid) => {
        const propertyIds = getPropertyRecords(sid);
        allPropertyIds = allPropertyIds.concat(propertyIds);
      });

      log.debug(
        loggerTitle,
        `Property Records found: ${JSON.stringify(allPropertyIds)}`
      );

      // 5. Update property records to use primary street ID
      allPropertyIds.forEach((propertyId) => {
        try {
          record.submitFields({
            type: 'customrecord_property_record',
            id: propertyId,
            values: {
              custrecord31: primaryStreetId,
            },
            options: {
              enablesourcing: false,
              ignoreMandatoryFields: true,
            },
          });
          log.debug(
            loggerTitle,
            `Updated property ID ${propertyId} to use street ID ${primaryStreetId}`
          );
        } catch (error) {
          log.error(
            loggerTitle + ` Error updating property ID ${propertyId}`,
            error
          );
        }
      });

      // 6. Mark duplicate streets as inactive
      duplicateStreetIds.forEach((sid) => {
        if (!markAsInactive(sid)) {
          log.error(
            loggerTitle,
            `Failed to mark street ID ${sid} as inactive.`
          );
        }
      });
    } catch (error) {
      log.error(loggerTitle + ' caught an exception', error);
    }
    //
    log.audit(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
    );
  };
  /* --------------------------- Reduce Phase - End --------------------------- */
  //
  /* ------------------------- Summarize Phase - Begin ------------------------ */
  /**
   *
   * @param {object} summarizeContext
   */
  const summarize = (summarizeContext) => {
    const loggerTitle = 'Summarize Phase';
    log.audit(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    //
    try {
      log.audit(
        loggerTitle + ' Usage',
        'Summary Usage: ' + summarizeContext.usage
      );
      log.audit(
        loggerTitle + ' Concurrency',
        'Summary Concurrency: ' + summarizeContext.concurrency
      );
      log.audit(
        loggerTitle + ' Yields',
        'Summary Yields: ' + summarizeContext.yields
      );
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }
    //
    log.audit(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
    );
  };
  /* ------------------------- Summarize Phase - End ------------------------ */
  //
  /* ------------------------ Helper Functions - Begin ------------------------ */
  //
  /* *********************** getStreetIds - Begin *********************** */
  /**
   *
   * @param {Number} subdivisionId
   * @param {String} streetName
   */
  const getStreetIds = (subdivisionId, streetName) => {
    const loggerTitle = 'Get Street Ids';
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    //
    const ids = [];
    try {
      const res = search
        .create({
          type: 'customrecord_street_name',
          filters: [
            [
              'custrecord_subdivision.internalidnumber',
              'equalto',
              subdivisionId,
            ],
            'AND',
            ['name', 'is', streetName],
          ],
          columns: [search.createColumn({ name: 'internalid' })],
        })
        .run();

      log.debug(loggerTitle + ' result ', res);

      res.each((r) => {
        ids.push(r.id);
        return true;
      });
    } catch (error) {
      log.error(loggerTitle + ' caught an exception', error);
    }
    //
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
    );
    return ids;
  };
  /* *********************** getStreetIds - End *********************** */
  //
  /* *********************** getPropertyRecords - Begin *********************** */
  /**
   *
   * @param {Number} streetId
   */
  const getPropertyRecords = (streetId) => {
    const loggerTitle = 'Get Property Records';
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    //
    const ids = [];
    try {
      const res = search
        .create({
          type: 'customrecord_property_record',
          filters: [['custrecord31.internalidnumber', 'equalto', streetId]],
          columns: [search.createColumn({ name: 'internalid' })],
        })
        .run();
      //
      log.debug(loggerTitle + ' result ', res);
      //
      res.each((r) => {
        ids.push(r.id);
        return true;
      });
    } catch (error) {
      log.error(loggerTitle + ' caught an exception', error);
    }
    //
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
    );
    return ids;
  };
  /* *********************** getPropertyRecords - End *********************** */
  //
  /* *********************** markAsPrimary - Begin *********************** */
  /**
   * Marks a street record as primary by setting custrecord_hsm_primary_street to true.
   * @param {Number} streetId - The internal ID of the street record to mark as primary.
   * @returns {boolean} - True if successful, false if an error occurs.
   */
  const markAsPrimary = (streetId) => {
    const loggerTitle = 'Mark As Primary';
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    //
    try {
      record.submitFields({
        type: 'customrecord_street_name',
        id: streetId,
        values: {
          custrecord_hsm_primary_street: true,
        },
        options: {
          enablesourcing: false,
          ignoreMandatoryFields: true,
        },
      });
      log.debug(loggerTitle, `Marked street ID ${streetId} as primary.`);
    } catch (error) {
      log.error(loggerTitle + ' caught an exception', error);
      return false;
    }
    //
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
    );
    return true;
  };
  /* *********************** markAsPrimary - End *********************** */
  //
  /* *********************** markAsInactive - Begin *********************** */
  /**
   * Marks a street record as inactive by setting isinactive to true.
   * @param {Number} streetId - The internal ID of the street record to mark as inactive.
   * @returns {boolean} - True if successful, false if an error occurs.
   */
  const markAsInactive = (streetId) => {
    const loggerTitle = 'Mark As Inactive';
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    //
    try {
      record.submitFields({
        type: 'customrecord_street_name',
        id: streetId,
        values: {
          isinactive: true,
        },
        options: {
          enablesourcing: false,
          ignoreMandatoryFields: true,
        },
      });
      log.debug(loggerTitle, `Marked street ID ${streetId} as inactive.`);
    } catch (error) {
      log.error(loggerTitle + ' caught an exception', error);
      return false;
    }
    //
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
    );
    return true;
  };
  /* *********************** markAsInactive - End *********************** */
  //
  /* ------------------------- Helper Functions - End ------------------------- */
  //
  /* ----------------------------- Exports - Begin ---------------------------- */
  exports.getInputData = getInputData;
  exports.map = map;
  exports.reduce = reduce;
  exports.summarize = summarize;
  return exports;
  /* ------------------------------ Exports - End ----------------------------- */
});
