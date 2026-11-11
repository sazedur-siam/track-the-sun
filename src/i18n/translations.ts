/**
 * Translation strings for TrackTheSun.
 *
 * Keys are flat, dot-namespaced. Use `{param}` placeholders for interpolation.
 * `en` is the source of truth and the fallback; keep `bn` in sync key-for-key.
 */

export type Language = 'en' | 'bn';

export const LANGUAGE_LABELS: Record<Language, string> = {
  en: 'EN',
  bn: 'বাং',
};

export const translations: Record<Language, Record<string, string>> = {
  en: {
    // Common
    'common.tagline': 'Find the shady side of your journey',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.error': 'Error',
    'common.departsAt': 'Departs {time}',

    // Navigation
    'nav.home': 'Home',
    'nav.saved': 'Saved',

    // Language
    'lang.label': 'Language',

    // Home
    'home.currentLocation': 'Current location',
    'home.locating': 'Locating…',
    'home.favorites': 'Favorites',
    'home.from': 'From',
    'home.to': 'To',
    'home.searchFrom': 'Search starting location...',
    'home.searchTo': 'Search destination...',
    'home.departureTime': 'Departure Time',
    'home.findSeat': 'Find My Seat',
    'home.tracingSun': 'Tracing sun…',
    'home.helper': 'Enter a start and destination to analyze sun exposure.',
    'home.swapA11y': 'Swap origin and destination',
    'home.saveA11y': 'Save this route to favorites',
    'home.favoritesA11y': 'Open favorite routes',
    'home.routeNotFoundTitle': 'Route Not Found',
    'home.routeNotFoundMsg':
      'Unable to find a route between these locations. Please try different locations.',
    'home.errorMsg':
      'Failed to calculate route. Please check your internet connection and try again.',
    'home.savedTitle': 'Saved',
    'home.savedMsg': 'Route saved to favorites!',
    'home.saveErrorMsg': 'Failed to save favorite route.',

    // Location input
    'location.clearA11y': 'Clear {label} location',
    'location.fieldA11y': '{label} location',

    // Current location button
    'currentLocation.permissionTitle': 'Permission Denied',
    'currentLocation.permissionMsg':
      'Location permission is required to use your current location.',
    'currentLocation.errorMsg': 'Failed to get your current location. Please try again.',
    'currentLocation.a11y': 'Use my current location as the starting point',

    // Time picker
    'time.now': 'Now',
    'time.done': 'Done',
    'time.invalidDate': 'Invalid Date',
    'time.nowA11y': 'Set departure time to now',
    'time.changeA11y': 'Departure time, {time}. Tap to change.',
    'time.doneA11y': 'Done choosing time',

    // Result screen
    'result.headerTitle': 'Your Seat Result',
    'result.recommendedSeat': 'RECOMMENDED SEAT',
    'result.sitOnSide': 'Sit on the {side} side',
    'result.eitherSide': 'Either side is fine',
    'result.balancedExposure': 'Balanced exposure',
    'result.sunEachSide': 'Sun on each side',
    'result.journey': 'Journey',
    'result.distance': 'Distance',
    'result.travelTime': 'Travel time',
    'result.departure': 'Departure',
    'result.arrival': 'Arrival ≈',
    'result.disclaimer':
      'Travel time is estimated from typical driving speeds and ignores real-time traffic.',
    'result.newSearch': 'New Search',
    'result.noRouteTitle': 'No Route Found',
    'result.noRouteText': 'Unable to calculate this route. Please try again.',
    'result.goBack': 'Go Back',
    'result.summaryNoSun':
      'No direct sunlight during this journey (nighttime or low sun angle).',
    'result.summaryBalanced': 'Sun exposure is balanced — either side is fine.',
    'result.summaryRecommend':
      'Sit on the {sit} side — the sun is mostly on your {sun} (facing {facing}) for {percent}% of the trip.',
    'result.summaryRecommendNoFacing':
      'Sit on the {sit} side — the sun is mostly on your {sun} for {percent}% of the trip.',
    'result.savedTitle': 'Saved',
    'result.savedMsg': 'Route has been added to your favorites.',
    'result.saveErrorMsg': 'Failed to save route.',
    'result.saveA11y': 'Save route to favorites',
    'result.newSearchA11y': 'Start a new search',
    'result.goBackA11y': 'Go back',

    // Bus diagram
    'diagram.front': 'Front',
    'diagram.left': 'Left',
    'diagram.right': 'Right',
    'diagram.sitHere': 'Sit here',
    'diagram.legendSun': '% of trip in sun',
    'diagram.legendSeat': 'Recommended seat',

    // Sides (used inside sentences)
    'side.left': 'left',
    'side.right': 'right',

    // Compass (short codes)
    'compassShort.N': 'N',
    'compassShort.NE': 'NE',
    'compassShort.E': 'E',
    'compassShort.SE': 'SE',
    'compassShort.S': 'S',
    'compassShort.SW': 'SW',
    'compassShort.W': 'W',
    'compassShort.NW': 'NW',

    // Compass (full names)
    'compassFull.N': 'north',
    'compassFull.NE': 'northeast',
    'compassFull.E': 'east',
    'compassFull.SE': 'southeast',
    'compassFull.S': 'south',
    'compassFull.SW': 'southwest',
    'compassFull.W': 'west',
    'compassFull.NW': 'northwest',

    // Saved screen
    'saved.title': 'Saved Routes',
    'saved.countOne': '{count} saved route',
    'saved.countOther': '{count} saved routes',
    'saved.empty': 'No saved routes yet',
    'saved.emptySub': 'Save your frequent routes from the home screen for quick access.',
    'saved.tapHint': 'Tap to find your seat',
    'saved.loading': 'Loading saved locations…',
    'saved.deleteTitle': 'Delete Favorite',
    'saved.deleteMsg': 'Are you sure you want to remove this saved location?',
    'saved.routeNotFoundTitle': 'Route Not Found',
    'saved.routeNotFoundMsg': 'Unable to find a route for this saved location.',
    'saved.errorMsg': 'Failed to calculate route. Please try again.',
    'saved.calcA11y': 'Calculate route {name}',
    'saved.deleteA11y': 'Delete {name}',

    // Favorites modal
    'favorites.title': 'Favorite Routes',
    'favorites.empty': 'No favorite routes yet',
    'favorites.emptySub': 'Save your frequent routes for quick access',
    'favorites.deleteTitle': 'Delete Favorite',
    'favorites.deleteMsg': 'Are you sure you want to remove this favorite route?',
    'favorites.useA11y': 'Use route {name}',
    'favorites.deleteA11y': 'Delete {name}',
    'favorites.closeA11y': 'Close',

    // Name input modal
    'nameModal.title': 'Save Favorite Route',
    'nameModal.label': 'Route Name',
    'nameModal.placeholder': 'e.g., Home to Work',
    'nameModal.a11y': 'Route name',

    // Units
    'units.km': 'km',
    'units.m': 'm',
    'units.hour': 'h',
    'units.min': 'm',

    // Settings
    'nav.settings': 'Settings',
    'settings.title': 'Settings',
    'settings.providerSection': 'Route provider',
    'settings.providerHint': 'Where TrackTheSun gets the driving route from.',
    'settings.osrmTitle': 'OSRM (free)',
    'settings.osrmDesc': 'OpenStreetMap routes. No key needed. No live traffic.',
    'settings.googleTitle': 'Google Maps',
    'settings.googleDesc': 'Google Routes API with live traffic for more accurate timing. Needs an API key.',
    'settings.googleNeedsKey': 'Add a Google API key below to use Google Maps.',
    'settings.keySection': 'Google Maps API key',
    'settings.keyUsingUser': 'Using your key ({key})',
    'settings.keyUsingBuiltIn': 'Using the built-in key ({key})',
    'settings.keyNone': 'No key set',
    'settings.keyPlaceholder': 'Paste a new API key',
    'settings.keyInputA11y': 'Google Maps API key',
    'settings.showKeyA11y': 'Show key',
    'settings.hideKeyA11y': 'Hide key',
    'settings.testAndSave': 'Test & save',
    'settings.testCurrent': 'Test current key',
    'settings.removeKey': 'Remove my key',
    'settings.testing': 'Testing…',
    'settings.keyOk': 'The key works.',
    'settings.keySaved': 'Key saved. Google Maps is now your route provider.',
    'settings.keyFailed': "This key didn't work: {reason}.",
    'settings.keyFallbackNote':
      'If Google fails (for example, the key expired or ran out of quota), TrackTheSun uses OSRM automatically.',
    'settings.keyHelp': 'Create a key in Google Cloud Console with the "Routes API" enabled.',

    // Routing errors (used as {reason})
    'routingError.missing_key': 'no API key is set',
    'routingError.invalid_key': 'the key is invalid, expired, or not allowed to use the Routes API',
    'routingError.quota': 'the quota or rate limit was reached',
    'routingError.no_route': 'no route was found',
    'routingError.network': "the server couldn't be reached",
    'routingError.server': 'the provider returned an error',

    // Route source
    'provider.osrm': 'OSRM',
    'provider.google': 'Google Maps',
    'result.routeBy': 'Route by {provider}',
    'result.liveTraffic': 'live traffic',
    'result.fallbackTitle': 'Google Maps not used',
    'result.fallbackMsg': 'Showing a free OSRM route instead, because {reason}.',
    'result.openSettings': 'Open settings',
  },

  bn: {
    // Common
    'common.tagline': 'আপনার যাত্রার ছায়াযুক্ত দিকটি বেছে নিন',
    'common.save': 'সংরক্ষণ',
    'common.cancel': 'বাতিল',
    'common.delete': 'মুছুন',
    'common.error': 'ত্রুটি',
    'common.departsAt': 'ছাড়ার সময় {time}',

    // Navigation
    'nav.home': 'হোম',
    'nav.saved': 'সংরক্ষিত',

    // Language
    'lang.label': 'ভাষা',

    // Home
    'home.currentLocation': 'বর্তমান অবস্থান',
    'home.locating': 'অবস্থান শনাক্ত হচ্ছে…',
    'home.favorites': 'পছন্দসমূহ',
    'home.from': 'যেখান থেকে',
    'home.to': 'যেখানে',
    'home.searchFrom': 'যাত্রা শুরুর স্থান খুঁজুন...',
    'home.searchTo': 'গন্তব্য খুঁজুন...',
    'home.departureTime': 'যাত্রার সময়',
    'home.findSeat': 'আমার আসন খুঁজুন',
    'home.tracingSun': 'সূর্য নির্ণয় হচ্ছে…',
    'home.helper': 'সূর্যের প্রভাব বিশ্লেষণ করতে যাত্রার শুরু ও গন্তব্য দিন।',
    'home.swapA11y': 'যাত্রার শুরু ও গন্তব্য অদলবদল করুন',
    'home.saveA11y': 'এই রুটটি পছন্দে সংরক্ষণ করুন',
    'home.favoritesA11y': 'পছন্দের রুটগুলো খুলুন',
    'home.routeNotFoundTitle': 'রুট পাওয়া যায়নি',
    'home.routeNotFoundMsg':
      'এই স্থানগুলোর মধ্যে কোনো রুট পাওয়া যায়নি। অনুগ্রহ করে ভিন্ন স্থান চেষ্টা করুন।',
    'home.errorMsg':
      'রুট গণনা ব্যর্থ হয়েছে। আপনার ইন্টারনেট সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।',
    'home.savedTitle': 'সংরক্ষিত হয়েছে',
    'home.savedMsg': 'রুটটি পছন্দে সংরক্ষিত হয়েছে!',
    'home.saveErrorMsg': 'পছন্দের রুট সংরক্ষণ ব্যর্থ হয়েছে।',

    // Location input
    'location.clearA11y': '{label} অবস্থান মুছুন',
    'location.fieldA11y': '{label} অবস্থান',

    // Current location button
    'currentLocation.permissionTitle': 'অনুমতি প্রত্যাখ্যাত',
    'currentLocation.permissionMsg': 'বর্তমান অবস্থান ব্যবহার করতে অবস্থানের অনুমতি প্রয়োজন।',
    'currentLocation.errorMsg': 'আপনার বর্তমান অবস্থান পাওয়া যায়নি। আবার চেষ্টা করুন।',
    'currentLocation.a11y': 'শুরুর স্থান হিসেবে আমার বর্তমান অবস্থান ব্যবহার করুন',

    // Time picker
    'time.now': 'এখন',
    'time.done': 'সম্পন্ন',
    'time.invalidDate': 'অবৈধ তারিখ',
    'time.nowA11y': 'যাত্রার সময় এখন নির্ধারণ করুন',
    'time.changeA11y': 'যাত্রার সময়, {time}। পরিবর্তন করতে চাপুন।',
    'time.doneA11y': 'সময় নির্বাচন সম্পন্ন',

    // Result screen
    'result.headerTitle': 'আপনার আসন ফলাফল',
    'result.recommendedSeat': 'প্রস্তাবিত আসন',
    'result.sitOnSide': '{side} দিকে বসুন',
    'result.eitherSide': 'যেকোনো দিকেই ঠিক আছে',
    'result.balancedExposure': 'সমান সূর্যালোক',
    'result.sunEachSide': 'প্রতি দিকে সূর্যালোক',
    'result.journey': 'যাত্রা',
    'result.distance': 'দূরত্ব',
    'result.travelTime': 'ভ্রমণের সময়',
    'result.departure': 'যাত্রা শুরু',
    'result.arrival': 'পৌঁছানো ≈',
    'result.disclaimer':
      'ভ্রমণের সময় সাধারণ গাড়ির গতির ভিত্তিতে অনুমান করা এবং সরাসরি যানজট বিবেচনা করে না।',
    'result.newSearch': 'নতুন অনুসন্ধান',
    'result.noRouteTitle': 'কোনো রুট পাওয়া যায়নি',
    'result.noRouteText': 'এই রুট গণনা করা যায়নি। আবার চেষ্টা করুন।',
    'result.goBack': 'ফিরে যান',
    'result.summaryNoSun': 'এই যাত্রায় সরাসরি সূর্যালোক নেই (রাত বা সূর্যের নিচু কোণ)।',
    'result.summaryBalanced': 'সূর্যালোক উভয় দিকে সমান — যেকোনো দিকেই ঠিক আছে।',
    'result.summaryRecommend':
      '{sit} দিকে বসুন — যাত্রার {percent}% সময় সূর্য মূলত আপনার {sun} দিকে ({facing} মুখী) থাকে।',
    'result.summaryRecommendNoFacing':
      '{sit} দিকে বসুন — যাত্রার {percent}% সময় সূর্য মূলত আপনার {sun} দিকে থাকে।',
    'result.savedTitle': 'সংরক্ষিত হয়েছে',
    'result.savedMsg': 'রুটটি আপনার পছন্দে যোগ হয়েছে।',
    'result.saveErrorMsg': 'রুট সংরক্ষণ ব্যর্থ হয়েছে।',
    'result.saveA11y': 'রুট পছন্দে সংরক্ষণ করুন',
    'result.newSearchA11y': 'নতুন অনুসন্ধান শুরু করুন',
    'result.goBackA11y': 'ফিরে যান',

    // Bus diagram
    'diagram.front': 'সামনে',
    'diagram.left': 'বাঁ',
    'diagram.right': 'ডান',
    'diagram.sitHere': 'এখানে বসুন',
    'diagram.legendSun': 'সূর্যে যাত্রার %',
    'diagram.legendSeat': 'প্রস্তাবিত আসন',

    // Sides (used inside sentences)
    'side.left': 'বাঁ',
    'side.right': 'ডান',

    // Compass (short codes)
    'compassShort.N': 'উ',
    'compassShort.NE': 'উপূ',
    'compassShort.E': 'পূ',
    'compassShort.SE': 'দপূ',
    'compassShort.S': 'দ',
    'compassShort.SW': 'দপ',
    'compassShort.W': 'প',
    'compassShort.NW': 'উপ',

    // Compass (full names)
    'compassFull.N': 'উত্তর',
    'compassFull.NE': 'উত্তর-পূর্ব',
    'compassFull.E': 'পূর্ব',
    'compassFull.SE': 'দক্ষিণ-পূর্ব',
    'compassFull.S': 'দক্ষিণ',
    'compassFull.SW': 'দক্ষিণ-পশ্চিম',
    'compassFull.W': 'পশ্চিম',
    'compassFull.NW': 'উত্তর-পশ্চিম',

    // Saved screen
    'saved.title': 'সংরক্ষিত রুট',
    'saved.countOne': '{count}টি সংরক্ষিত রুট',
    'saved.countOther': '{count}টি সংরক্ষিত রুট',
    'saved.empty': 'এখনও কোনো সংরক্ষিত রুট নেই',
    'saved.emptySub': 'দ্রুত অ্যাক্সেসের জন্য হোম স্ক্রিন থেকে আপনার নিয়মিত রুটগুলো সংরক্ষণ করুন।',
    'saved.tapHint': 'আপনার আসন খুঁজতে চাপুন',
    'saved.loading': 'সংরক্ষিত অবস্থান লোড হচ্ছে…',
    'saved.deleteTitle': 'পছন্দ মুছুন',
    'saved.deleteMsg': 'আপনি কি নিশ্চিতভাবে এই সংরক্ষিত অবস্থানটি মুছতে চান?',
    'saved.routeNotFoundTitle': 'রুট পাওয়া যায়নি',
    'saved.routeNotFoundMsg': 'এই সংরক্ষিত অবস্থানের জন্য রুট পাওয়া যায়নি।',
    'saved.errorMsg': 'রুট গণনা ব্যর্থ হয়েছে। আবার চেষ্টা করুন।',
    'saved.calcA11y': 'রুট গণনা করুন {name}',
    'saved.deleteA11y': '{name} মুছুন',

    // Favorites modal
    'favorites.title': 'পছন্দের রুট',
    'favorites.empty': 'এখনও কোনো পছন্দের রুট নেই',
    'favorites.emptySub': 'দ্রুত অ্যাক্সেসের জন্য আপনার নিয়মিত রুট সংরক্ষণ করুন',
    'favorites.deleteTitle': 'পছন্দ মুছুন',
    'favorites.deleteMsg': 'আপনি কি নিশ্চিতভাবে এই পছন্দের রুটটি মুছতে চান?',
    'favorites.useA11y': 'রুট ব্যবহার করুন {name}',
    'favorites.deleteA11y': '{name} মুছুন',
    'favorites.closeA11y': 'বন্ধ',

    // Name input modal
    'nameModal.title': 'পছন্দের রুট সংরক্ষণ',
    'nameModal.label': 'রুটের নাম',
    'nameModal.placeholder': 'যেমন, বাসা থেকে অফিস',
    'nameModal.a11y': 'রুটের নাম',

    // Units
    'units.km': 'কিমি',
    'units.m': 'মি',
    'units.hour': 'ঘ',
    'units.min': 'মিন',

    // Settings
    'nav.settings': 'সেটিংস',
    'settings.title': 'সেটিংস',
    'settings.providerSection': 'রুট সরবরাহকারী',
    'settings.providerHint': 'TrackTheSun কোথা থেকে গাড়ির রুট নেবে।',
    'settings.osrmTitle': 'OSRM (ফ্রি)',
    'settings.osrmDesc': 'OpenStreetMap রুট। কোনো কী লাগে না। লাইভ ট্রাফিক নেই।',
    'settings.googleTitle': 'Google Maps',
    'settings.googleDesc': 'লাইভ ট্রাফিকসহ Google Routes API, তাই সময়ের হিসাব আরও নির্ভুল। একটি API কী লাগে।',
    'settings.googleNeedsKey': 'Google Maps ব্যবহার করতে নিচে একটি Google API কী যোগ করুন।',
    'settings.keySection': 'Google Maps API কী',
    'settings.keyUsingUser': 'আপনার কী ব্যবহার হচ্ছে ({key})',
    'settings.keyUsingBuiltIn': 'বিল্ট-ইন কী ব্যবহার হচ্ছে ({key})',
    'settings.keyNone': 'কোনো কী সেট করা নেই',
    'settings.keyPlaceholder': 'নতুন API কী পেস্ট করুন',
    'settings.keyInputA11y': 'Google Maps API কী',
    'settings.showKeyA11y': 'কী দেখান',
    'settings.hideKeyA11y': 'কী লুকান',
    'settings.testAndSave': 'পরীক্ষা করে সংরক্ষণ',
    'settings.testCurrent': 'বর্তমান কী পরীক্ষা করুন',
    'settings.removeKey': 'আমার কী মুছুন',
    'settings.testing': 'পরীক্ষা চলছে…',
    'settings.keyOk': 'কী কাজ করছে।',
    'settings.keySaved': 'কী সংরক্ষিত হয়েছে। এখন Google Maps আপনার রুট সরবরাহকারী।',
    'settings.keyFailed': 'এই কী কাজ করেনি: {reason}।',
    'settings.keyFallbackNote':
      'Google ব্যর্থ হলে (যেমন কী-এর মেয়াদ শেষ বা কোটা শেষ), TrackTheSun স্বয়ংক্রিয়ভাবে OSRM ব্যবহার করবে।',
    'settings.keyHelp': 'Google Cloud Console-এ "Routes API" চালু করে একটি কী তৈরি করুন।',

    // Routing errors (used as {reason})
    'routingError.missing_key': 'কোনো API কী সেট করা নেই',
    'routingError.invalid_key': 'কী অবৈধ, মেয়াদোত্তীর্ণ, অথবা Routes API ব্যবহারের অনুমতি নেই',
    'routingError.quota': 'কোটা বা রেট লিমিট শেষ হয়েছে',
    'routingError.no_route': 'কোনো রুট পাওয়া যায়নি',
    'routingError.network': 'সার্ভারে পৌঁছানো যায়নি',
    'routingError.server': 'সরবরাহকারী একটি ত্রুটি দিয়েছে',

    // Route source
    'provider.osrm': 'OSRM',
    'provider.google': 'Google Maps',
    'result.routeBy': 'রুট: {provider}',
    'result.liveTraffic': 'লাইভ ট্রাফিক',
    'result.fallbackTitle': 'Google Maps ব্যবহার করা যায়নি',
    'result.fallbackMsg': 'এর বদলে ফ্রি OSRM রুট দেখানো হচ্ছে, কারণ {reason}।',
    'result.openSettings': 'সেটিংস খুলুন',
  },
};
