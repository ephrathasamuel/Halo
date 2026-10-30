'use client';

import { callDomain } from '@/app/actions/halo';
import { reloadData } from '@/lib/client/cache';

/*
 * The browser's way to change anything in Halo. Same names and arguments as
 * the functions in lib/domain, but they run on the server (as the signed-in
 * user, with all of Halo's checks) and return a Promise. After each change the
 * browser's copy of the data is reloaded so every page shows it.
 */
function remote(name) {
  return async (...args) => {
    try {
      const result = await callDomain(name, args);
      await reloadData();
      return result ?? { ok: false, error: 'No response' };
    } catch {
      return { ok: false, error: 'Network problem. Please try again.' };
    }
  };
}

export const publishAnnouncement = remote('announcements.publishAnnouncement');
export const toggleAnnouncement = remote('announcements.toggleAnnouncement');
export const deleteAnnouncement = remote('announcements.deleteAnnouncement');
export const createBooking = remote('bookings.createBooking');
export const cancelBooking = remote('bookings.cancelBooking');
export const transitionBooking = remote('bookings.transitionBooking');
export const createOwnerBooking = remote('bookings.createOwnerBooking');
export const openDispute = remote('disputes.openDispute');
export const resolveDispute = remote('disputes.resolveDispute');
export const submitEventRequest = remote('events.submitEventRequest');
export const sendQuote = remote('events.sendQuote');
export const respondToQuote = remote('events.respondToQuote');
export const advanceEvent = remote('events.advanceEvent');
export const saveListing = remote('listings.saveListing');
export const deactivateListing = remote('listings.deactivateListing');
export const updateListingAvailability = remote('listings.updateListingAvailability');
export const moderateListing = remote('listings.moderateListing');
export const saveProvider = remote('providers.saveProvider');
export const savePortfolioItem = remote('providers.savePortfolioItem');
export const deletePortfolioItem = remote('providers.deletePortfolioItem');
export const moderateProvider = remote('providers.moderateProvider');
export const createReview = remote('reviews.createReview');
export const replyToReview = remote('reviews.replyToReview');
export const createPurchaseRequest = remote('sales.createPurchaseRequest');
export const updatePurchaseRequest = remote('sales.updatePurchaseRequest');
export const suspendUser = remote('users.suspendUser');
export const reinstateUser = remote('users.reinstateUser');
export const moveRegionalAdmin = remote('users.moveRegionalAdmin');
export const removeRegionalAdmin = remote('users.removeRegionalAdmin');
export const updateProfile = remote('users.updateProfile');
export const setBookingsPaused = remote('settings.setBookingsPaused');
