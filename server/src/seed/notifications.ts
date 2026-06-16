import mongoose from 'mongoose';
import { appConfig } from '../config/app';
import { Notification } from '../models/Notification';
import { User } from '../models/User';

const seedNotifications = async () => {
  if (!appConfig.mongoUri) {
    throw new Error('MONGODB_URI is not configured');
  }

  await mongoose.connect(appConfig.mongoUri);

  const clientUser = await User.findOne({ email: 'client@example.com' });
  if (!clientUser) {
    console.log('No demo client user found, skipping notification seed');
    await mongoose.disconnect();
    return;
  }

  const existingNotifs = await Notification.countDocuments({ userId: clientUser._id });
  if (existingNotifs > 0) {
    console.log(`Demo user already has ${existingNotifs} notifications, skipping`);
    await mongoose.disconnect();
    return;
  }

  const demoNotifications = [
    {
      userId: clientUser._id,
      type: 'booking',
      title: 'Booking Confirmed',
      message: 'Your booking with Ama Stylez is confirmed! Box Braids on Saturday at 2:00 PM.',
      link: '/app/my-bookings',
      read: false,
      createdAt: new Date(Date.now() - 10 * 60 * 1000),
    },
    {
      userId: clientUser._id,
      type: 'stylist',
      title: 'New Stylist Available',
      message: 'Nails by Efua has opened new appointment slots this weekend.',
      link: '/app/stylist/6a1ae72c6f96c21bce929ba1',
      read: false,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
    {
      userId: clientUser._id,
      type: 'badge',
      title: 'Badge Earned!',
      message: 'Congratulations! You earned the "First Booking" badge.',
      link: '/app/rewards',
      read: false,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
    {
      userId: clientUser._id,
      type: 'badge',
      title: 'Badge Earned!',
      message: 'You unlocked the "Early Adopter" badge for joining GlowUp.',
      link: '/app/rewards',
      read: true,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
    {
      userId: clientUser._id,
      type: 'promo',
      title: 'Weekend Special',
      message: '20% off all braiding services this weekend! Use code BRAIDS20.',
      link: '/app',
      read: true,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
    {
      userId: clientUser._id,
      type: 'reminder',
      title: 'Appointment Reminder',
      message: 'Your appointment with Kwame\'s Barber Shop starts in 1 hour.',
      link: '/app/my-bookings',
      read: true,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
  ];

  await Notification.insertMany(demoNotifications);
  console.log(`Seeded ${demoNotifications.length} demo notifications`);
  await mongoose.disconnect();
};

seedNotifications().catch(async (error) => {
  console.error('Notification seed failed:', error);
  await mongoose.disconnect();
  process.exit(1);
});
