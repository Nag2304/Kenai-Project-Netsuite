/**
 * name of the function MUST be process
 */
function process(email) {
  //Print out FROM email address
  nlapiLogExecution('debug', 'From Email Address', email.getFrom());

  //Print out TO email address
  nlapiLogExecution('debug', 'To Email Address', email.getTo());

  //Print out CC email Addresses
  nlapiLogExecution('debug', 'CC Email Addresses', email.getCc());

  //Print out Reply To Email Address
  nlapiLogExecution('debug', 'Reply To Address', email.getReplyTo());

  //Print out Email Sent Date
  nlapiLogExecution('debug', 'Send Date', email.getSentDate());

  //Print out Email Subject
  nlapiLogExecution('debug', 'Email Subject', email.getSubject());

  //Print out Email TEXT Body
  nlapiLogExecution('debug', 'Email Text Body', email.getTextBody());

  //Print out Email HTML Body
  nlapiLogExecution('debug', 'Email HTML Body', email.getHtmlBody());

  //Grab an Array of ALL Attachments
  var attachFiles = email.getAttachments();
  nlapiLogExecution('debug', 'Attachments Size', attachFiles.length);

  //Loop through list of ALL Attachments and find out details of each file
  for (var f = 0; f < attachFiles.length; f++) {
    //Print out Attached File Type
    nlapiLogExecution('debug', 'File Type', attachFile[f].getType());

    //Print out Attached File Name
    nlapiLogExecution('debug', 'File Name', attachFile[f].getName());

    //Print out Contents of the File
    nlapiLogExecution('debug', 'File Content', attachFile[f].getValue());
  }
}
