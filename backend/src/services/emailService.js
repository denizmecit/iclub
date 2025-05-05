const sgMail = require('@sendgrid/mail');

// Set SendGrid API Key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Function to format date and time
const formatDateTime = (date, time) => {
  const eventDate = new Date(date);
  const formattedDate = eventDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  return `${formattedDate} at ${time}`;
};

// Send event confirmation email
const sendEventConfirmationEmail = async (user, event) => {
  try {
    console.log('Attempting to send email to:', user.email);
    console.log('Using SendGrid service');

    const emailContent = `
      Dear ${user.firstName} ${user.lastName},

      Thank you for joining the event "${event.title}"!

      Event Details:
      - Date & Time: ${formatDateTime(event.date, event.time)}
      - Location: ${event.location}
      - Description: ${event.description}
      ${event.registrationLink ? `\n      - Registration Link: ${event.registrationLink}` : ''}

      We look forward to seeing you there!

      Best regards,
      The iClub Team
    `;

    const msg = {
      to: user.email,
      from: process.env.EMAIL_USER,
      subject: `Event Registration Confirmation: ${event.title}`,
      text: emailContent,
      html: emailContent.replace(/\n/g, '<br>')
    };

    const response = await sgMail.send(msg);
    console.log('Event confirmation email sent successfully');
    console.log('Response:', response[0].statusCode);
    return response;
  } catch (error) {
    console.error('Error sending event confirmation email:', error);
    if (error.response) {
      console.error('SendGrid error details:', error.response.body);
    }
    throw error;
  }
};

module.exports = {
  sendEventConfirmationEmail
}; 