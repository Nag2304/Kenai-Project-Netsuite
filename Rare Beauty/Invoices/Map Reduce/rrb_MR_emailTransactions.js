/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 * File name: rrb_MR_emailTransactions.js
 * Script: RRB | MR Email Transactions
 * Author           Date       Version               Remarks
 * nagendrababu  7th Nov 2024     1.00        Initial creation of the script
 * Charles.Bastian  2025-01-30  v25.1.30-1    Updated for case 6164328 to patch broken code, and update email send to link to transaction and customer.
 * Charles.Bastian  2025-02-11  v25.2.11-1    Updated email.send subject to use tranid instead of internalid.
 *
 */

/* -------------------------- Script Usage - Begin -------------------------- */

/* -------------------------- Script Usage - End -------------------------- */

/* global define,log*/

define(['N/search', 'N/record', 'N/file', 'N/email', 'N/render', 'N/runtime'], (
  search,
  record,
  file,
  email,
  render,
  runtime
) => {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  const fileName = 'Invoice_';
  const sendTransactionField = 'custrecord_ec_send_invoices';
  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* ------------------------- Get Input Data - Begin ------------------------- */
  const getInputData = () => {
    const customers = getCustomersWithEmailContact();
    const filterArr = ['customer.internalid', 'anyof'];
    customers.forEach(function (customer) {
      filterArr.push(customer);
    });
    log.debug('getInputData.filterArr', JSON.stringify(filterArr));
    return search.create({
      type: 'invoice',
      filters: [
        ['type', 'anyof', 'CustInvc'],
        'AND',
        ['custbody_blk_inv_emailed', 'is', 'F'],
        'AND',
        filterArr,
        'AND',
        ['datecreated', 'after', '01/01/2020 11:59 pm'],
        'AND',
        ['mainline', 'is', 'T'],
        'AND',
        ['postingperiod', 'rel', 'TFY'],
      ],
      columns: [
        search.createColumn({ name: 'internalid', label: 'Internal ID' }),
        search.createColumn({ name: 'currency', label: 'Currency' }),
        search.createColumn({
          name: 'internalid',
          join: 'customer',
          label: 'Internal ID',
        }),
        search.createColumn({
          name: 'transactionname',
          label: 'Transaction Name',
        }),
        search.createColumn({
          name: 'custbody_blk_inv_emailed',
          label: 'Invoice Emailed',
        }),
      ],
    });
  };
  /* ------------------------- Get Input Data - End ------------------------- */
  //
  /* -------------------------- Reduce Phase - Begin -------------------------- */
  /**
   *
   * @param {object} reduceContext
   */
  const reduce = (reduceContext) => {
    const loggerTitle = 'Reduce Phase';
    log.audit(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );

    try {
      // Retrieve Key & Values
      const key = reduceContext.key;
      log.debug(loggerTitle, ' Invoice Internal ID: ' + key);

      const results = JSON.parse(reduceContext.values[0]);
      log.debug(loggerTitle + ' Reduce Context Values', results);

      const eachValue = results.values;
      log.debug(loggerTitle + ' Each Value', eachValue);
      //

      // Retrieve Customer
      const customer = eachValue['internalid.customer'].value;
      log.debug(loggerTitle, ' Customer ID:' + customer);
      //

      // Retrieve Currency & TemplateID
      const currency = eachValue.currency.value;
      const templateId = searchTemplate(currency);
      log.debug(loggerTitle, ' Template ID:' + templateId);
      //

      // Send Emails
      sendEmails(templateId, key, customer);
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
  /* *********************** getCustomersWithEmailContact - Begin *********************** */
  /**
   * Retrieves a list of customer IDs who have email contacts, excluding specific IDs.
   *
   * @returns {Array} Array of customer IDs with email contacts.
   */
  const getCustomersWithEmailContact = () => {
    const loggerTitle = ' Get Customers With Email Contact ';
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    // Initialize an empty array to store customer IDs
    const customers = [];

    try {
      // Create a search object to retrieve customer email contact records,
      // excluding customers with IDs 4393 and 14825
      const emailContactSearch = search.create({
        type: 'customrecord_blk_email_contact',
        filters: [['custrecord_ec_customer', 'noneof', '4393', '14825']],
        columns: [
          search.createColumn({
            name: 'custrecord_ec_customer',
            summary: 'GROUP',
            label: 'Customer',
          }),
        ],
      });

      // Log the total number of records found
      const resultCount = emailContactSearch.runPaged().count;
      log.debug(loggerTitle, 'Number of email contacts found' + resultCount);

      // Iterate over each result and add the customer ID to the customers array
      emailContactSearch.run().each((result) => {
        // Extract the customer ID from the grouped results and add to customers array
        const customerId =
          result.getAllValues()['GROUP(custrecord_ec_customer)'][0].value;
        customers.push(customerId);
        return true; // Continue processing each result
      });
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
    );
    // Return the array of customer IDs
    return customers;
  };

  /* *********************** getCustomersWithEmailContact - End *********************** */
  //
  /* *********************** sendEmails - Begin *********************** */
  /**
   * Sends an email with a PDF invoice attachment to the customer based on the specified template and invoice.
   *
   * @param {Number} templateId - The ID of the email template to load.
   * @param {Number} invoiceInternalId - The internal ID of the invoice record to load.
   * @param {Number} customer - The customer ID associated with the invoice.
   */
  const sendEmails = (templateId, invoiceInternalId, customer) => {
    const loggerTitle = 'Send Emails';
    log.debug(loggerTitle, '|>------------------- Start -------------------<|');

    try {
      // Load the invoice record based on the provided internal ID
      const invoiceRecord = record.load({
        type: record.Type.INVOICE,
        id: invoiceInternalId,
      });

      // Load and configure the email template for generating the PDF attachment
      const templateFile = file.load({ id: templateId });
      const renderTemplate = render.create();
      renderTemplate.templateContent = templateFile.getContents();

      // Extract invoice number and add it to the rendered PDF as a unique identifier
      const documentNumber = invoiceRecord.getValue({ fieldId: 'tranid' });
      renderTemplate.addRecord('record', invoiceRecord);
      const attachment = renderTemplate.renderAsPdf();
      attachment.name = `${fileName}_${documentNumber}.pdf`;

      // Retrieve customer and sales representative information from the invoice
      const entityId = invoiceRecord.getValue({ fieldId: 'entity' });
      const salesRepId = invoiceRecord.getValue({ fieldId: 'salesrep' });
      log.debug(loggerTitle, { customer, entityId, salesRepId });

      // Fetch customer emails associated with the transaction
      var recipientEmails = getCustomerEmails(entityId, salesRepId);
      log.debug(loggerTitle + ' Receipients Emails', recipientEmails);

      if (recipientEmails.length > 0) {
        // Retrieve or determine the author of the email
        const scriptObj = runtime.getCurrentScript();
        let authorId =
          scriptObj.getParameter({
            name: 'custscript_rrb_empinternalid_new',
          }) || getEmailAuthor();

        authorId = parseInt(authorId);

        log.debug(
          'recipientEmails',
          typeof recipientEmails + ' >> ' + JSON.stringify(recipientEmails)
        );
        // Send the email with the PDF attachment to all collected email recipients
        email.send({
          author: authorId,
          recipients: recipientEmails,
          subject: `Rare Beauty Brands: Invoice ${documentNumber}`,
          body: `Please open the attached file to view your Invoice. To view the attachment, you first need the free Adobe Acrobat Reader. Visit Adobe's website at http://www.adobe.com/products/acrobat/readstep.html to download it.`,
          attachments: [attachment],
          relatedRecords: {
            entityId: entityId,
            transactionId: invoiceInternalId,
          },
        });

        log.audit(loggerTitle, 'Emails Sent Successfully');

        // Mark the invoice as emailed by setting a custom field
        invoiceRecord.setValue({
          fieldId: 'custbody_blk_inv_emailed',
          value: true,
        });

        // Save the updated invoice record
        const savedInvoiceId = invoiceRecord.save();
        log.audit(loggerTitle, `Invoice Saved Successfully: ${savedInvoiceId}`);
      }
    } catch (error) {
      // Log any error encountered during the process
      log.error(`${loggerTitle} encountered an error`, error);
    }

    log.debug(loggerTitle, '|>------------------- End -------------------<|');
  };

  /* *********************** sendEmails - End *********************** */
  //
  /* *********************** searchTemplate - Begin *********************** */
  /**
   * Searches for a template record associated with a specific currency and returns its file ID.
   *
   * @param {string} currency - The currency ID to search for.
   * @returns {string} The file ID of the found template, or an empty string if none found.
   */
  const searchTemplate = (currency) => {
    const loggerTitle = ' Search Template ';
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
    );
    //
    let templateId = 0;
    try {
      // Create a search object for customrecord258 with a filter based on the provided currency
      const templateSearch = search.create({
        type: 'customrecord258',
        filters: [['custrecord_ctm_currency', 'anyof', currency]],
        columns: [
          search.createColumn({
            name: 'custrecord_rrb_file_id',
            label: 'File ID',
          }),
        ],
      });

      log.debug(
        loggerTitle,
        `Currency Used for searching template: ${currency}`
      );

      // Get the total count of results from the search
      const resultCount = templateSearch.runPaged().count;
      log.debug(loggerTitle, 'No of records found:' + resultCount);

      // Iterate over search results; capture the file ID from the first result found
      templateSearch.run().each((result) => {
        templateId = result.getValue('custrecord_rrb_file_id');
        return false; // Exit after retrieving the first result
      });
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }
    //
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
    );
    // Return the template file ID or an empty string if no result was found
    return templateId;
  };
  /* *********************** searchTemplate - End *********************** */
  //
  /* ***********************  getEmailAuthor - Begin *********************** */
  const getEmailAuthor = () => {
    const loggerTitle = ' Get Email Author ';
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
    );
    //
    let id = '';
    try {
      const employeeSearchObj = search.create({
        type: 'employee',
        filters: [
          ['custentity_official_email_author', 'is', 'T'],
          'AND',
          ['isinactive', 'is', 'F'],
        ],
        columns: [
          search.createColumn({
            name: 'entityid',
            sort: search.Sort.ASC,
            label: 'Name',
          }),
          search.createColumn({ name: 'internalid', label: 'Internal ID' }),
        ],
      });
      const searchResultCount = employeeSearchObj.runPaged().count;
      log.debug(loggerTitle, ' Search Result: ' + searchResultCount);

      if (searchResultCount > 0) {
        employeeSearchObj.run().each(function (result) {
          id = result.getValue('internalid');
        });
      }
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }
    //
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
    );
    return id;
  };
  /* ***********************  getEmailAuthor - End *********************** */
  //
  /* ***********************  getCustomerEmails- Begin *********************** */
  /**
   *
   * @param {Number} entityId
   * @param {Number} salesRepId
   * @returns
   */
  const getCustomerEmails = (entityId, salesRepId) => {
    const loggerTitle = ' Get Customer Emails ';
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
    );
    //
    const emails = [];
    let employeeEmail = '';
    let category = '';
    try {
      // If the entity (customer) exists, look up the customer's category
      if (entityId) {
        const customerLookup = search.lookupFields({
          type: search.Type.CUSTOMER,
          id: String(entityId),
          columns: ['category'],
        });
        category = customerLookup.category[0]?.value;
      }

      // If the sales representative exists and category is 'professional' (represented by '1')
      if (salesRepId && category === '1') {
        const employeeLookup = search.lookupFields({
          type: search.Type.EMPLOYEE,
          id: String(salesRepId),
          columns: ['email'],
        });
        employeeEmail = employeeLookup.email;
        log.debug(loggerTitle, ' Employee Email: ' + employeeEmail);
      }

      log.debug(loggerTitle, `${sendTransactionField} cust id ${entityId}`);

      // Search for email contacts associated with the customer and the specific transaction type
      const emailContactSearch = search.create({
        type: 'customrecord_blk_email_contact',
        filters: [
          ['custrecord_ec_customer', 'anyof', entityId],
          'AND',
          [sendTransactionField, 'is', 'T'],
        ],
        columns: [
          search.createColumn({
            name: 'custrecord_ec_email',
            label: 'Email Address',
          }),
        ],
      });

      // Log the count of found email contact records
      const resultCount = emailContactSearch.runPaged().count;
      log.debug(loggerTitle, 'Number of email contacts found ' + resultCount);

      // Collect each found email address into the emails array
      emailContactSearch.run().each((result) => {
        emails.push(result.getValue('custrecord_ec_email'));
        return true; // Continue iterating over results
      });

      // Add the sales representative's email if it was found and meets conditions
      if (employeeEmail) {
        emails.push(employeeEmail);
      }
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }
    //
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
    );
    return emails;
  };
  /* ***********************  getCustomerEmails - End *********************** */
  //
  /* ------------------------- Helper Functions - End ------------------------- */
  //
  /* ----------------------------- Exports - Begin ---------------------------- */
  exports.getInputData = getInputData;
  exports.reduce = reduce;
  exports.summarize = summarize;
  return exports;
  /* ------------------------------ Exports - End ----------------------------- */
});
