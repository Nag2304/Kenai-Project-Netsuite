/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

/**
 * File name: scm_MR_updateSweeperWorkOrders.js
 * Script: SCM | MR Update Sweeper Work Orders
 * Author           Date       Version               Remarks
 * Nagendra Babu   04.19.2025      1.00        Initial creation of the script
 * Nagendra Babu   08.09.2025      1.01        Converted to Map/Reduce, added logic to only update if SC-40-0000 exists, added SCM assembly check
 */

/* -------------------------- Script Usage - Begin -------------------------- */
/**
 * Purpose: Updates Sweeper Work Orders by replacing the generic Broom item (SC-40-0000) with the item
 * specified in the Broom field only if SC-40-0000 exists, removing the V/S with Reverse item if applicable,
 * and marking the Work Order as updated. Do not reschedule until issue is resolved.
 * Trigger: Map/Reduce execution to process qualifying Work Orders.
 * Criteria:
 * - Sweeper Work Order field (custbody_scm_sweeper_order) is TRUE
 * - Work Order Updated field (custbody_scm_wo_updated) is FALSE
 * - Assembly item ID starts with 'SCM'
 * - SC-40-0000 exists as a component
 */
/* -------------------------- Script Usage - End -------------------------- */

/* global define, log */

define(['N/record', 'N/search', 'N/runtime'], (record, search, runtime) => {
  /* ------------------------ Global Constants - Begin ------------------------ */
  const SCRIPT_NAME = 'SCM | MR Update Sweeper Work Orders';
  const GENERIC_BROOM_ITEM_ID = '1119'; // SC-40-0000
  const VS_REVERSE_ITEM_ID = '3228'; // SC-70-0287
  const USAGE_THRESHOLD = 9000; // Warn if usage exceeds 90% of 10,000-unit limit
  const SIDE_SHIFT_PART_IDS = ['5908', '6750'];
  /* ------------------------- Global Constants - End ------------------------- */

  /* ------------------------- Map/Reduce Functions - Begin ------------------- */

  /**
   * Gets the input data for the Map/Reduce script by creating a search for qualifying Work Orders.
   * @returns {Object} Search object for Work Orders
   */
  const getInputData = () => {
    return search.create({
      type: 'workorder',
      settings: [{ name: 'consolidationtype', value: 'ACCTTYPE' }],
      filters: [
        ['type', 'anyof', 'WorkOrd'],
        'AND',
        ['custbody_scm_sweeper_order', 'is', 'T'],
        'AND',
        ['custbody_scm_wo_updated', 'is', 'F'],
        'AND',
        ['mainline', 'is', 'T'],
        'AND',
        ['internalid', 'anyof', '43303'],
      ],
      columns: [
        search.createColumn({ name: 'internalid', label: 'Internal ID' }),
      ],
    });
  };

  /**
   * Reduces the input data to update the Work Orders.
   * @param {Object} reduceContext - Map/Reduce reduce context
   */
  const reduce = (reduceContext) => {
    const loggerTitle = `${SCRIPT_NAME} - Reduce`;
    const workOrderId = reduceContext.key;
    try {
      log.debug({
        title: loggerTitle,
        details: `Starting to process Work Order ID: ${workOrderId}`,
      });

      const woRecord = record.load({
        type: record.Type.WORK_ORDER,
        id: workOrderId,
        isDynamic: true,
      });
      log.debug({
        title: loggerTitle,
        details: `Work Order ${workOrderId} loaded successfully`,
      });

      const lineCount = woRecord.getLineCount({ sublistId: 'item' });
      log.debug({
        title: loggerTitle,
        details: `Work Order ${workOrderId} has ${lineCount} item lines`,
      });
      let hasGenericBroom = false;
      let broomItemName = woRecord.getValue({
        fieldId: 'custbody_scm_broom_for_sweeper',
      });
      log.debug({
        title: loggerTitle,
        details: `Broom item name for WO ${workOrderId}: ${
          broomItemName || 'None'
        }`,
      });
      let broomItemId = broomItemName ? getItemInternalId(broomItemName) : null;
      let includesVSReverse = woRecord.getValue({
        fieldId: 'custbody_scm_vs_reverse',
      });
      log.debug({
        title: loggerTitle,
        details: `Includes V/S Reverse for WO ${workOrderId}: ${includesVSReverse}`,
      });
      let includesSideShift = woRecord.getValue({
        fieldId: 'custbody_scm_incl_side_shift',
      });

      log.debug({
        title: loggerTitle,
        details: `Includes Side Shift for WO ${workOrderId}: ${includesSideShift}`,
      });

      for (let i = 0; i < lineCount; i++) {
        const itemId = woRecord.getSublistValue({
          sublistId: 'item',
          fieldId: 'item',
          line: i,
        });
        if (String(itemId) === GENERIC_BROOM_ITEM_ID) {
          hasGenericBroom = true;
          log.debug({
            title: loggerTitle,
            details: `Generic broom found at line ${i} in WO ${workOrderId}`,
          });
          break;
        }
      }
      let changesMade = false;
      if (hasGenericBroom) {
        log.debug({
          title: loggerTitle,
          details: `Proceeding with updates for WO ${workOrderId} as generic broom exists`,
        });

        if (broomItemId) {
          updateBroomItem(woRecord, broomItemId);
          changesMade = true;
          log.debug({
            title: loggerTitle,
            details: `Broom item updated for WO ${workOrderId}`,
          });
        } else {
          log.audit({
            title: loggerTitle,
            details: `No valid broom item ID for WO ${workOrderId}, skipping broom update`,
          });
        }

        if (includesVSReverse) {
          removeVSReverseItem(woRecord);
          changesMade = true;
          log.debug({
            title: loggerTitle,
            details: `V/S Reverse item removed for WO ${workOrderId}`,
          });
        }
      }
      if (includesSideShift) {
        const removed = removeSideShiftPart(woRecord);
        if (removed) {
          changesMade = true;
        }

        if (changesMade) {
          woRecord.setValue({
            fieldId: 'custbody_scm_wo_updated',
            value: true,
          });
          const savedId = woRecord.save({ ignoreMandatoryFields: false });
          log.audit({
            title: loggerTitle,
            details: `Successfully updated Work Order ID: ${savedId}`,
          });
        } else {
          log.audit({
            title: loggerTitle,
            details: `No updates applied to Work Order ID: ${workOrderId}`,
          });
        }
      } else {
        log.audit({
          title: loggerTitle,
          details: `No generic broom found in Work Order ${workOrderId}, skipping update`,
        });
      }
    } catch (error) {
      log.error({
        title: `${loggerTitle} - Error`,
        details: `Error in reduce for WO ${workOrderId}: ${JSON.stringify(
          error,
        )}`,
      });
    }
  };

  /**
   * Finalizes the Map/Reduce process by logging completion.
   * @param {Object} summarizeContext - Map/Reduce summarize context
   */
  const summarize = (summarizeContext) => {
    const loggerTitle = `${SCRIPT_NAME} - Summarize`;
    log.debug({
      title: loggerTitle,
      details: '|>------------------- Summarize - Entry -------------------<|',
    });
    const scriptObj = runtime.getCurrentScript();
    log.debug({
      title: loggerTitle,
      details: `Final governance units remaining: ${scriptObj.getRemainingUsage()}`,
    });
    if (scriptObj.getRemainingUsage() < 10000 - USAGE_THRESHOLD) {
      log.audit({
        title: `${loggerTitle} - Usage Warning`,
        details: `Usage approaching limit: ${scriptObj.getRemainingUsage()} units remaining`,
      });
    }
    log.debug({
      title: loggerTitle,
      details: '|>------------------- Summarize - Exit -------------------<|',
    });
  };

  /* ------------------------- Helper Functions - Begin ------------------------ */

  /**
   * Retrieves the internal ID of an item based on its item name.
   * @param {string} itemName - The name of the item
   * @returns {string|null} The internal ID of the item, or null if not found
   */
  const getItemInternalId = (itemName) => {
    const loggerTitle = `${SCRIPT_NAME} - Get Item Internal ID`;
    try {
      log.debug({
        title: loggerTitle,
        details: `Looking up internal ID for item name: ${itemName}`,
      });
      if (!itemName) {
        log.audit({
          title: loggerTitle,
          details: 'Item name is empty or undefined, returning null',
        });
        return null;
      }

      const itemSearch = search.create({
        type: search.Type.ITEM,
        filters: [['name', 'haskeywords', itemName]],
        columns: ['internalid'],
      });

      let internalId = null;
      itemSearch.run().each((result) => {
        internalId = result.getValue('internalid');
        return false;
      });

      if (internalId) {
        log.debug({
          title: loggerTitle,
          details: `Found internal ID: ${internalId} for item name: ${itemName}`,
        });
      } else {
        log.audit({
          title: loggerTitle,
          details: `No item found with item name: ${itemName}`,
        });
      }

      return internalId;
    } catch (error) {
      log.error({
        title: `${loggerTitle} - Error`,
        details: `Error looking up item internal ID: ${JSON.stringify(error)}`,
      });
      return null;
    }
  };

  /**
   * Updates the Broom item in the Work Order by removing SC-40-0000 and adding the new broom.
   * @param {Object} woRecord - Work Order record
   * @param {string} broomItemId - Internal ID of the Broom item
   */
  const updateBroomItem = (woRecord, broomItemId) => {
    const loggerTitle = `${SCRIPT_NAME} - Update Broom Item`;
    const sublistId = 'item';
    const linesToRemove = [];

    const lineCount = woRecord.getLineCount({ sublistId });
    log.debug({
      title: loggerTitle,
      details: `Work Order has ${lineCount} item lines to check`,
    });

    for (let i = 0; i < lineCount; i++) {
      const itemId = woRecord.getSublistValue({
        sublistId,
        fieldId: 'item',
        line: i,
      });
      if (String(itemId) === GENERIC_BROOM_ITEM_ID) {
        linesToRemove.push(i);
        log.debug({
          title: loggerTitle,
          details: `Generic broom found at line ${i}, marked for removal`,
        });
      }
    }

    linesToRemove
      .sort((a, b) => b - a)
      .forEach((line) => {
        woRecord.removeLine({ sublistId, line });
        log.debug({
          title: loggerTitle,
          details: `Removed generic Broom at line ${line}`,
        });
      });

    if (broomItemId) {
      woRecord.selectNewLine({ sublistId });
      woRecord.setCurrentSublistValue({
        sublistId,
        fieldId: 'item',
        value: broomItemId,
      });
      woRecord.setCurrentSublistValue({
        sublistId,
        fieldId: 'quantity',
        value: 1,
      });
      woRecord.commitLine({ sublistId });
      log.debug({
        title: loggerTitle,
        details: `Added new Broom item ${broomItemId} with quantity 1`,
      });
    } else {
      log.audit({
        title: loggerTitle,
        details: `No valid broomItemId provided, skipping addition`,
      });
    }
  };

  /**
   * Removes the V/S with Reverse item from the Work Order.
   * @param {Object} woRecord - Work Order record
   */
  const removeVSReverseItem = (woRecord) => {
    const loggerTitle = `${SCRIPT_NAME} - Remove V/S Reverse Item`;
    const sublistId = 'item';
    const lineCount = woRecord.getLineCount({ sublistId });
    let vsReverseLine = -1;

    log.debug({
      title: loggerTitle,
      details: `Checking ${lineCount} item lines for V/S Reverse`,
    });
    for (let i = 0; i < lineCount; i++) {
      const itemId = woRecord.getSublistValue({
        sublistId,
        fieldId: 'item',
        line: i,
      });
      if (String(itemId) === VS_REVERSE_ITEM_ID) {
        vsReverseLine = i;
        log.debug({
          title: loggerTitle,
          details: `V/S Reverse found at line ${i}`,
        });
        break;
      }
    }

    if (vsReverseLine !== -1) {
      woRecord.removeLine({ sublistId, line: vsReverseLine });
      log.debug({
        title: loggerTitle,
        details: `Removed V/S Reverse item at line ${vsReverseLine}`,
      });
    } else {
      log.debug({
        title: loggerTitle,
        details: `No V/S Reverse item found in Work Order`,
      });
    }
  };

  /**
   * Removes side shift related part from the Work Order if present.
   * Removes either SC-76-0003 (5908) or SC-76-0033 (6750).
   *
   * @param {Object} woRecord
   * @returns {boolean} true if a line was removed
   */
  const removeSideShiftPart = (woRecord) => {
    const loggerTitle = `${SCRIPT_NAME} - Remove Side Shift Part`;
    const sublistId = 'item';
    const lineCount = woRecord.getLineCount({ sublistId });

    for (let i = 0; i < lineCount; i++) {
      const itemId = woRecord.getSublistValue({
        sublistId,
        fieldId: 'item',
        line: i,
      });

      if (SIDE_SHIFT_PART_IDS.includes(String(itemId))) {
        woRecord.removeLine({ sublistId, line: i });

        log.audit({
          title: loggerTitle,
          details: `Removed side shift part (item ${itemId}) at line ${i}`,
        });

        return true; // only one will ever exist
      }
    }

    log.debug({
      title: loggerTitle,
      details: 'No side shift part found to remove',
    });

    return false;
  };

  /* ------------------------- Helper Functions - End ------------------------- */
  //
  /* ------------------------------ Exports Begin ----------------------------- */
  return {
    getInputData,
    reduce,
    summarize,
  };
  /* ------------------------------- Exports End ------------------------------ */
});
