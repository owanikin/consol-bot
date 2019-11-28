const twilio = require('twilio')
const nlpService = require('../services/nlp.service')
const {
    TWILIO_SID: accountSid,
    TWILIO_KEY: TwilloAuthToken
  } = process.env;

twilio(accountSid, TwilloAuthToken);
const { MessagingResponse } = twilio.twiml;

const WhatsappController = () => {
    const incoming = async (req, res) => {
      const { body } = req;
      const message = body.Body
      const twiml = new MessagingResponse();

      try {
        const nlpResult = await nlpService().detectIntent(message)
        const response = nlpResult.response

        twiml.message(response);

        res.set('Content-Type', 'text/xml');
  
        return res.status(200).send(twiml.toString());
          
      } catch (error) {
        twiml.message('Unable to process your message');
         
        res.set('Content-Type', 'text/xml');

        return res.status(200).send(twiml.toString());
      }
    };
  
  
  
    return {
        incoming
    };
  };
  
  module.exports = WhatsappController;