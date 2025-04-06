const { User, ClientUser } = require('../models');
const fs = require('fs');
const path = require('path');

// Helper to get or create client user profile
async function getOrCreateClientProfile(userId) {
  try {
    console.log('getOrCreateClientProfile called for userId:', userId);
    
    // First, get the main user to check it exists
    const mainUser = await User.findByPk(userId);
    if (!mainUser) {
      console.log('Main user not found');
      throw new Error('User not found');
    }
    
    console.log('Main user found:', mainUser.id);

    // Look for existing client profile
    let clientProfile = await ClientUser.findOne({ 
      where: { userId: userId }
    });

    console.log('Client profile found?', !!clientProfile);

    // If profile doesn't exist, create one
    if (!clientProfile) {
      console.log('Creating new client profile for user:', userId);
      clientProfile = await ClientUser.create({
        userId: userId,
        username: mainUser.email.split('@')[0],
        name: mainUser.name,
        email: mainUser.email,
        bio: 'Tell us about yourself',
        profilePhoto: '',
        backgroundImage: '',
        highlights: [],
        achievements: []
      });
      console.log('Created new client profile with ID:', clientProfile.id);
    }

    return clientProfile;
  } catch (error) {
    console.error('Error in getOrCreateClientProfile:', error);
    throw error;
  }
}

// Get user data from PostgreSQL
async function getUserData(userId) {
  try {
    console.log('getUserData called for userId:', userId);
    const profile = await getOrCreateClientProfile(userId);
    
    console.log('Client profile retrieved:', {
      id: profile.id,
      email: profile.email,
      highlightsType: typeof profile.highlights,
      highlightsLength: Array.isArray(profile.highlights) ? profile.highlights.length : 'not an array'
    });
    
    // Make sure highlights is an array
    let highlights = [];
    if (profile.highlights) {
      if (typeof profile.highlights === 'string') {
        try {
          highlights = JSON.parse(profile.highlights);
        } catch (e) {
          console.error('Error parsing highlights JSON:', e);
          highlights = [];
        }
      } else if (Array.isArray(profile.highlights)) {
        highlights = profile.highlights;
      }
    }
    
    console.log('Processed highlights:', highlights);
    
    return {
      bio: profile.bio || '',
      profilePhoto: profile.profilePhoto || '',
      backgroundImage: profile.backgroundImage || '',
      highlights: highlights,
      name: profile.name,
      email: profile.email,
      username: profile.username,
      achievements: Array.isArray(profile.achievements) ? profile.achievements : []
    };
  } catch (error) {
    console.error('Error in getUserData:', error);
    throw error;
  }
}

// Update profile photo
async function updateProfilePhoto(userId, filePath) {
  try {
    console.log('updateProfilePhoto called for userId:', userId);
    const profile = await getOrCreateClientProfile(userId);
    
    profile.profilePhoto = filePath;
    await profile.save();
    
    console.log('Profile photo updated to:', filePath);
    
    return { success: true, profilePhoto: filePath };
  } catch (error) {
    console.error('Error in updateProfilePhoto:', error);
    throw error;
  }
}

// Update background image
async function updateBackgroundImage(userId, filePath) {
  try {
    console.log('updateBackgroundImage called for userId:', userId);
    const profile = await getOrCreateClientProfile(userId);
    
    profile.backgroundImage = filePath;
    await profile.save();
    
    console.log('Background image updated to:', filePath);
    
    return { success: true, backgroundImage: filePath };
  } catch (error) {
    console.error('Error in updateBackgroundImage:', error);
    throw error;
  }
}

// Update highlights
async function updateHighlights(userId, newHighlights) {
  try {
    console.log('updateHighlights called for userId:', userId);
    console.log('New highlights to add:', newHighlights);
    
    const profile = await getOrCreateClientProfile(userId);
    
    // Get current highlights and ensure it's an array
    let currentHighlights = profile.highlights || [];
    
    if (typeof currentHighlights === 'string') {
      try {
        currentHighlights = JSON.parse(currentHighlights);
      } catch (e) {
        console.error('Error parsing highlights JSON string:', e);
        currentHighlights = [];
      }
    }
    
    if (!Array.isArray(currentHighlights)) {
      console.warn('Highlights was not an array, resetting to empty array');
      currentHighlights = [];
    }
    
    console.log('Current highlights before update:', currentHighlights);
    
    // Add new highlights to the array
    const updatedHighlights = [...currentHighlights];
    for (const highlight of newHighlights) {
      if (!updatedHighlights.some(h => h.url === highlight.url)) {
        updatedHighlights.push(highlight);
      }
    }
    
    console.log('Updated highlights array (before save):', updatedHighlights);
    
    // Save updated highlights to the profile
    profile.highlights = updatedHighlights;
    await profile.save();
    
    // Force a refresh from the database to check what was actually saved
    await profile.reload();
    
    // Get the highlights after reload
    let savedHighlights = profile.highlights;
    console.log('Highlights after reload:', 
      Array.isArray(savedHighlights) ? savedHighlights : 'not an array',
      'Length:', Array.isArray(savedHighlights) ? savedHighlights.length : 'N/A',
      'Raw data:', savedHighlights
    );
    
    return { 
      success: true, 
      highlights: savedHighlights
    };
  } catch (error) {
    console.error('Error in updateHighlights:', error);
    throw error;
  }
}

// Remove a highlight
async function removeHighlight(userId, url) {
  try {
    console.log('removeHighlight called for userId:', userId);
    console.log('URL to remove:', url);
    
    const profile = await getOrCreateClientProfile(userId);
    
    // Ensure we're working with an array
    let highlights = [];
    if (profile.highlights) {
      if (typeof profile.highlights === 'string') {
        try {
          highlights = JSON.parse(profile.highlights);
        } catch (e) {
          console.error('Error parsing highlights JSON:', e);
          highlights = [];
        }
      } else if (Array.isArray(profile.highlights)) {
        highlights = profile.highlights;
      }
    }
    
    console.log('Current highlights before removal:', highlights);
    
    // Remove the highlight with the matching URL
    highlights = highlights.filter(h => h.url !== url);
    
    console.log('Highlights after removal:', highlights);
    
    // Save the updated highlights
    profile.highlights = highlights;
    await profile.save();
    
    return { success: true };
  } catch (error) {
    console.error('Error in removeHighlight:', error);
    throw error;
  }
}

// Update bio
async function updateBio(userId, bio) {
  try {
    console.log('updateBio called for userId:', userId);
    const profile = await getOrCreateClientProfile(userId);
    
    profile.bio = bio;
    await profile.save();
    
    console.log('Bio updated successfully');
    
    return { success: true, bio: bio };
  } catch (error) {
    console.error('Error in updateBio:', error);
    throw error;
  }
}

// Update Spotify tokens
async function updateSpotifyTokens(userId, tokens) {
  try {
    const profile = await getOrCreateClientProfile(userId);
    
    profile.spotify = {
      ...profile.spotify,
      ...tokens
    };
    
    await profile.save();
    
    return { success: true };
  } catch (error) {
    console.error('Error updating Spotify tokens:', error);
    throw error;
  }
}

// Update name
async function updateName(userId, name) {
  try {
    console.log('updateName called for userId:', userId);
    
    // Get the ClientUser model
    const { ClientUser, User } = require('../models');
    
    // Find the client user profile
    const clientUser = await ClientUser.findOne({
      where: { userId: userId }
    });
    
    if (!clientUser) {
      console.error('Client user not found for ID:', userId);
      throw new Error('User profile not found');
    }
    
    console.log('Found client user:', clientUser.id);
    
    // Update name
    clientUser.name = name;
    await clientUser.save();
    
    console.log('Updated client user name');
    
    // Also update main user
    try {
      const user = await User.findByPk(userId);
      if (user) {
        user.name = name;
        await user.save();
        console.log('Updated main user name');
      }
    } catch (err) {
      console.error('Error updating main user (but continuing):', err);
    }
    
    return { success: true, name };
  } catch (error) {
    console.error('Error in updateName:', error);
    throw error;
  }
}

module.exports = {
  getUserData,
  updateProfilePhoto,
  updateBackgroundImage,
  updateHighlights,
  removeHighlight,
  updateBio,
  updateSpotifyTokens,
  updateName
}; 