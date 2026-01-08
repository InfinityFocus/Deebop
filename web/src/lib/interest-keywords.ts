/**
 * Maps hashtags and keywords to interest slugs.
 * Used for automatic interest assignment when creating posts.
 *
 * Format: 'interest-slug': ['keyword1', 'keyword2', 'hashtag', ...]
 * All keywords should be lowercase (matching is case-insensitive)
 */
export const interestKeywords: Record<string, string[]> = {
  // ============================================
  // SPORTS - Motorsports
  // ============================================
  'formula-1': [
    'f1', 'formula1', 'formulaone', 'grandprix', 'gp',
    'verstappen', 'hamilton', 'leclerc', 'norris', 'sainz', 'piastri', 'russell', 'alonso', 'perez',
    'redbull', 'redbullracing', 'ferrari', 'scuderiaferrari', 'mclaren', 'mercedes', 'amgf1',
    'alpine', 'astonmartin', 'williams', 'haas', 'kicksauber', 'racingbulls',
    'monza', 'silverstone', 'monaco', 'spa', 'suzuka', 'interlagos',
  ],
  'motorsports': [
    'motorsport', 'motorsports', 'racing', 'racecar', 'racetrack',
    'nascar', 'indycar', 'wec', 'lemans', '24hoursoflemans', 'dtm', 'supergt',
    'touringcar', 'gtcar', 'gt3', 'gt4', 'endurance', 'enduranceracing',
    'karting', 'kart', 'drifting', 'drift', 'dragracing', 'dragrace',
  ],
  'motogp': [
    'motogp', 'moto2', 'moto3', 'motorcycleracing', 'bikeracing',
    'bagnaia', 'martin', 'marquez', 'quartararo', 'bastianini',
    'ducati', 'yamaha', 'honda', 'aprilia', 'ktm',
    'superbike', 'wsbk', 'bsb', 'sbk',
  ],

  // ============================================
  // SPORTS - Ball Sports
  // ============================================
  'football': [
    'football', 'soccer', 'futbol', 'footy',
    'premierleague', 'epl', 'laliga', 'bundesliga', 'seriea', 'ligue1',
    'championsleague', 'ucl', 'europaleague', 'worldcup', 'euros', 'euro2024',
    'arsenal', 'liverpool', 'chelsea', 'mancity', 'manutd', 'tottenham',
    'realmadrid', 'barcelona', 'bayern', 'psg', 'juventus', 'acmilan',
    'messi', 'ronaldo', 'haaland', 'mbappe', 'salah', 'bellingham',
  ],
  'basketball': [
    'basketball', 'hoops', 'bball',
    'nba', 'wnba', 'euroleague', 'ncaa', 'collegebasketball', 'marchmadness',
    'lakers', 'celtics', 'warriors', 'bulls', 'heat', 'nets', 'knicks',
    'lebron', 'curry', 'durant', 'giannis', 'jokic', 'tatum', 'doncic',
    'dunk', 'slam', 'threepointer', 'crossover',
  ],
  'tennis': [
    'tennis', 'tennisplayer',
    'wimbledon', 'usopen', 'frenchopen', 'rolandgarros', 'australianopen', 'grandslam',
    'atp', 'wta', 'atptour', 'wtatour',
    'djokovic', 'sinner', 'alcaraz', 'medvedev', 'zverev', 'nadal', 'federer',
    'swiatek', 'sabalenka', 'gauff', 'rybakina',
  ],
  'american-football': [
    'americanfootball', 'nfl', 'collegefootball', 'cfb',
    'superbowl', 'touchdown', 'quarterback', 'qb',
    'chiefs', 'eagles', 'niners', '49ers', 'cowboys', 'packers', 'bills', 'ravens',
    'mahomes', 'kelce', 'burrow', 'allen', 'jackson', 'hurts',
  ],
  'baseball': [
    'baseball', 'mlb', 'beisbol',
    'worldseries', 'homerun', 'grandslam', 'pitcher', 'strikeout',
    'yankees', 'dodgers', 'redsox', 'cubs', 'mets', 'braves', 'astros',
    'ohtani', 'trout', 'judge', 'betts', 'acuna',
  ],
  'cricket': [
    'cricket', 'cricketer',
    'ipl', 'bbl', 'psl', 't20', 'testcricket', 'odi', 'worldcup',
    'bcci', 'ecb', 'cricketaustralia',
    'kohli', 'rohit', 'babar', 'root', 'stokes', 'cummins', 'bumrah',
    'wicket', 'century', 'sixers', 'boundary',
  ],
  'rugby': [
    'rugby', 'rugbyunion', 'rugbyleague', 'rugbysevens',
    'sixnations', 'rugbyworldcup', 'superrugby', 'premiershiprugby',
    'allblacks', 'springboks', 'wallabies', 'england', 'ireland', 'wales', 'france',
    'scrum', 'try', 'lineout', 'ruck',
  ],
  'ice-hockey': [
    'hockey', 'icehockey', 'nhl', 'hockeyplayer',
    'stanleycup', 'playoffs',
    'oilers', 'panthers', 'bruins', 'rangers', 'leafs', 'canadiens', 'penguins',
    'mcdavid', 'crosby', 'ovechkin', 'mackinnon', 'matthews',
  ],
  'golf': [
    'golf', 'golfer', 'golfing', 'golflife', 'golfswing',
    'pga', 'pgatour', 'lpga', 'liv', 'livgolf', 'masters', 'usopen', 'theopen', 'pga',
    'rydercup', 'presidentscup',
    'scheffler', 'mcilroy', 'koepka', 'rahm', 'spieth', 'tiger', 'tigerwoods',
    'birdie', 'eagle', 'holeinone', 'par', 'bogey',
  ],

  // ============================================
  // SPORTS - Combat & Fitness
  // ============================================
  'martial-arts': [
    'martialarts', 'mma', 'ufc', 'bellator', 'pfl', 'onefc',
    'karate', 'taekwondo', 'judo', 'jiujitsu', 'bjj', 'brazilianjiujitsu',
    'muaythai', 'kickboxing', 'wrestling', 'grappling',
  ],
  'boxing': [
    'boxing', 'boxer', 'boxinglife',
    'heavyweight', 'knockout', 'ko', 'tko',
    'usyk', 'fury', 'joshua', 'canelo', 'haney', 'crawford', 'spence',
  ],
  'fitness': [
    'fitness', 'fit', 'fitfam', 'fitlife', 'fitnessjourney',
    'gym', 'gymlife', 'workout', 'workoutmotivation', 'training',
    'weightlifting', 'powerlifting', 'bodybuilding', 'crossfit',
    'gains', 'muscle', 'strength', 'cardio', 'hiit',
  ],
  'yoga': [
    'yoga', 'yogi', 'yogalife', 'yogapractice', 'yogaeveryday',
    'meditation', 'mindfulness', 'namaste', 'asana', 'vinyasa', 'hatha',
    'flexibility', 'stretching', 'wellness',
  ],
  'running': [
    'running', 'runner', 'run', 'runnersofinstagram', 'runningcommunity',
    'marathon', 'halfmarathon', '5k', '10k', 'ultramarathon', 'trailrunning',
    'jogging', 'jogger', 'parkrun',
  ],
  'cycling': [
    'cycling', 'cyclist', 'bike', 'biking', 'bicycle',
    'tourdefrance', 'tdf', 'giro', 'vuelta', 'grandtour',
    'roadcycling', 'mountainbike', 'mtb', 'bmx', 'gravel', 'gravelbike',
    'strava', 'peloton', 'zwift',
  ],
  'swimming': [
    'swimming', 'swimmer', 'swim', 'swimminglife',
    'pool', 'openwater', 'triathlon', 'ironman',
    'freestyle', 'backstroke', 'breaststroke', 'butterfly',
    'olympics', 'worldchampionships',
  ],
  'extreme-sports': [
    'extremesports', 'actionsports', 'adrenaline',
    'skateboarding', 'skate', 'skateboard', 'sk8',
    'surfing', 'surf', 'surfer', 'surflife',
    'snowboarding', 'snowboard', 'skiing', 'ski',
    'parkour', 'freerunning', 'climbing', 'rockclimbing', 'bouldering',
    'skydiving', 'basejumping', 'wingsuit',
  ],

  // ============================================
  // PHOTOGRAPHY
  // ============================================
  'portrait-photography': [
    'portrait', 'portraits', 'portraitphotography', 'portraiture',
    'headshot', 'headshots', 'faceshot', 'portraitmode',
  ],
  'landscape-photography': [
    'landscape', 'landscapephotography', 'landscapes', 'scenery',
    'naturephotography', 'earthpix', 'natgeo', 'nationalgeographic',
  ],
  'street-photography': [
    'streetphotography', 'streetphoto', 'streetsofinstagram', 'streetlife',
    'urbanphotography', 'citylife', 'cityscapes', 'urban',
  ],
  'wildlife-photography': [
    'wildlifephotography', 'wildlife', 'animalphoto', 'animals',
    'birds', 'birdphotography', 'birdwatching', 'naturewildlife',
  ],
  'macro-photography': [
    'macro', 'macrophotography', 'macrophoto', 'closeup',
    'insects', 'flowers', 'details', 'microworld',
  ],
  'astrophotography': [
    'astrophotography', 'astro', 'nightsky', 'stars', 'milkyway',
    'nightphotography', 'longexposure', 'stargazing', 'cosmos',
  ],
  'fashion-photography': [
    'fashionphotography', 'fashionphoto', 'fashionshoot',
    'editorial', 'vogue', 'highfashion', 'modelshoot',
  ],
  'sports-photography': [
    'sportsphotography', 'sportsphoto', 'actionshot', 'actionphotography',
    'sportsphotographer', 'gameday',
  ],
  'event-photography': [
    'eventphotography', 'eventphotographer', 'weddingphotography', 'wedding',
    'concertphotography', 'livemusicphotography', 'partyphotography',
  ],
  'food-photography': [
    'foodphotography', 'foodphoto', 'foodstyling', 'foodporn',
    'instafood', 'delicious', 'yummy',
  ],
  'travel-photography': [
    'travelphotography', 'travelphoto', 'wanderlust', 'explore',
    'travelgram', 'instatravel', 'travelblogger',
  ],
  'architecture-photography': [
    'architecturephotography', 'architecture', 'archidaily', 'architexture',
    'buildings', 'cityarchitecture', 'modernarchitecture',
  ],

  // ============================================
  // VIDEO
  // ============================================
  'short-films': ['shortfilm', 'shortfilms', 'filmmaker', 'indiefilm', 'cinema'],
  'documentaries': ['documentary', 'documentaries', 'docfilm', 'truecrime', 'realstory'],
  'music-videos': ['musicvideo', 'mv', 'musicvideos', 'officialvideo'],
  'vlogs': ['vlog', 'vlogs', 'vlogger', 'dailyvlog', 'lifevlog', 'travelvlog'],
  'video-tutorials': ['tutorial', 'tutorials', 'howto', 'learnwithme', 'stepbystep'],
  'animation': ['animation', 'animated', 'animator', '2danimation', '3danimation', 'cartoon'],
  'drone-footage': ['drone', 'dronephotography', 'dronestagram', 'aerial', 'aerialphotography', 'fpv'],
  'time-lapse': ['timelapse', 'hyperlapse', 'motionlapse', 'daytonight'],
  'slow-motion': ['slowmotion', 'slowmo', 'slomo', 'highspeed'],
  'live-streaming': ['livestream', 'streaming', 'twitch', 'kick', 'golive', 'live'],

  // ============================================
  // MUSIC
  // ============================================
  'electronic-music': [
    'electronic', 'electronicmusic', 'edm', 'techno', 'house', 'trance',
    'dubstep', 'dnb', 'drumandbass', 'deephouse', 'progressivehouse',
  ],
  'hip-hop': [
    'hiphop', 'rap', 'rapper', 'hiphopmusic', 'trap', 'drill',
    'beats', 'producer', 'rapmusic', 'undergroundhiphop',
  ],
  'rock-music': [
    'rock', 'rockmusic', 'rockband', 'alternativerock', 'indierock',
    'metal', 'heavymetal', 'punk', 'punkrock', 'grunge',
  ],
  'jazz': ['jazz', 'jazzmusic', 'jazzband', 'smoothjazz', 'bebop', 'swing'],
  'classical-music': [
    'classical', 'classicalmusic', 'orchestra', 'symphony', 'piano',
    'violin', 'cello', 'composer', 'opera',
  ],
  'rnb-soul': ['rnb', 'soul', 'soulmusic', 'randb', 'neosoul', 'motown'],
  'pop-music': ['pop', 'popmusic', 'popsinger', 'mainstream', 'hitmusic'],
  'indie-music': ['indie', 'indiemusic', 'indieartist', 'unsigned', 'emerging'],
  'world-music': ['worldmusic', 'afrobeats', 'reggae', 'latin', 'kpop', 'jpop'],
  'ambient-music': ['ambient', 'ambientmusic', 'chillout', 'lofi', 'relaxing'],

  // ============================================
  // ART
  // ============================================
  'digital-art': ['digitalart', 'digitalartist', 'digitalpainting', 'digitaldrawing', 'ipadart', 'procreate'],
  'traditional-art': ['traditionalart', 'painting', 'oilpainting', 'watercolor', 'acrylic', 'canvas'],
  'illustration': ['illustration', 'illustrator', 'illustrationart', 'characterdesign', 'bookillustration'],
  'graphic-design': ['graphicdesign', 'graphicdesigner', 'design', 'branding', 'logo', 'logodesign'],
  '3d-art': ['3dart', '3dartist', '3drender', 'blender', 'maya', 'cinema4d', 'cgi'],
  'typography': ['typography', 'type', 'typedesign', 'lettering', 'handlettering', 'calligraphy'],
  'concept-art': ['conceptart', 'conceptartist', 'gameconceptart', 'environmentart'],
  'pixel-art': ['pixelart', 'pixel', '8bit', '16bit', 'retrogaming', 'sprites'],
  'comic-art': ['comic', 'comics', 'comicart', 'comicartist', 'manga', 'webtoon'],
  'fan-art': ['fanart', 'fanartist', 'anime', 'animeart', 'characterart'],

  // ============================================
  // GAMING
  // ============================================
  'game-development': ['gamedev', 'gamedevelopment', 'indiedev', 'indiegame', 'unity', 'unrealengine'],
  'esports': ['esports', 'esport', 'competitive', 'progamer', 'tournament'],
  'game-streaming': ['twitch', 'twitchstreamer', 'streamer', 'kick', 'streaming'],
  'retro-gaming': ['retrogaming', 'retrogames', 'retro', 'nostalgia', 'oldschool', 'classicgaming'],
  'mobile-gaming': ['mobilegaming', 'mobilegames', 'ios', 'android', 'casualgaming'],
  'vr-gaming': ['vrgaming', 'vr', 'virtualreality', 'oculus', 'meta', 'psvr'],
  'speedrunning': ['speedrun', 'speedrunning', 'speedrunner', 'worldrecord', 'wr'],
  'game-art': ['gameart', 'gameartist', 'environmentart', 'characterart'],

  // ============================================
  // TECH
  // ============================================
  'web-development': ['webdev', 'webdevelopment', 'frontend', 'backend', 'fullstack', 'javascript', 'react', 'nextjs'],
  'mobile-apps': ['mobiledev', 'appdevelopment', 'ios', 'android', 'flutter', 'reactnative', 'swift', 'kotlin'],
  'ai-ml': ['ai', 'artificialintelligence', 'machinelearning', 'ml', 'deeplearning', 'datascience', 'chatgpt', 'llm'],
  'cybersecurity': ['cybersecurity', 'infosec', 'hacking', 'security', 'pentesting', 'bugbounty'],
  'hardware': ['hardware', 'pcbuild', 'custompc', 'electronics', 'arduino', 'raspberrypi', 'diy'],
  'open-source': ['opensource', 'github', 'foss', 'linux', 'coding', 'programming'],
  'gadgets': ['gadgets', 'tech', 'technology', 'gear', 'techreview', 'unboxing'],
  'tech-reviews': ['techreview', 'review', 'unboxing', 'comparison', 'firstlook'],

  // ============================================
  // FASHION
  // ============================================
  'streetwear': ['streetwear', 'streetstyle', 'streetfashion', 'hypebeast', 'supreme', 'offwhite'],
  'high-fashion': ['highfashion', 'luxury', 'designer', 'runway', 'couture', 'fashionweek'],
  'vintage-fashion': ['vintage', 'vintagestyle', 'vintagefashion', 'retro', 'thrift', 'secondhand'],
  'sustainable-fashion': ['sustainablefashion', 'sustainable', 'ethical', 'slowfashion', 'ecofashion'],
  'accessories': ['accessories', 'jewelry', 'watches', 'bags', 'sunglasses', 'hats'],
  'sneakers': ['sneakers', 'sneakerhead', 'kicks', 'jordans', 'nike', 'adidas', 'newbalance'],
  'diy-fashion': ['diyfashion', 'upcycle', 'handmade', 'custom', 'sewing'],
  'fashion-design': ['fashiondesign', 'fashiondesigner', 'patternmaking', 'draping'],

  // ============================================
  // FOOD & DRINK
  // ============================================
  'recipes': ['recipe', 'recipes', 'cooking', 'homemade', 'homecooking', 'chef'],
  'restaurant-reviews': ['restaurant', 'restaurantreview', 'foodie', 'foodreview', 'dining'],
  'baking': ['baking', 'baker', 'bakery', 'bread', 'pastry', 'cakes', 'dessert'],
  'cocktails': ['cocktails', 'cocktail', 'mixology', 'bartender', 'drinks', 'happyhour'],
  'coffee': ['coffee', 'coffeelover', 'barista', 'espresso', 'latte', 'cappuccino', 'cafe'],
  'wine': ['wine', 'winelover', 'winetasting', 'sommelier', 'vineyard', 'redwine', 'whitewine'],
  'street-food': ['streetfood', 'foodtruck', 'streetfoodlover', 'localfood'],
  'vegan-food': ['vegan', 'veganfood', 'plantbased', 'vegetarian', 'veganrecipes'],

  // ============================================
  // NATURE
  // ============================================
  'wildlife': ['wildlife', 'animals', 'wildanimals', 'safari', 'naturelover'],
  'plants': ['plants', 'plantlife', 'houseplants', 'gardening', 'botanical', 'flowers'],
  'oceans': ['ocean', 'sea', 'marine', 'underwater', 'diving', 'scuba', 'reef'],
  'mountains': ['mountains', 'mountain', 'hiking', 'summit', 'peaks', 'alps'],
  'weather': ['weather', 'storm', 'clouds', 'lightning', 'sunset', 'sunrise'],
  'conservation': ['conservation', 'wildlife', 'protect', 'endangered', 'savetheplanet'],
  'hiking': ['hiking', 'hike', 'hiker', 'trails', 'backpacking', 'trekking'],
  'camping': ['camping', 'camp', 'campfire', 'outdoors', 'tent', 'glamping'],

  // ============================================
  // LIFESTYLE
  // ============================================
  'travel': ['travel', 'traveling', 'traveler', 'wanderlust', 'vacation', 'holiday', 'adventure'],
  'interior-design': ['interiordesign', 'homedecor', 'interior', 'homedesign', 'decor'],
  'diy-crafts': ['diy', 'crafts', 'handmade', 'maker', 'creative', 'craft'],
  'parenting': ['parenting', 'mom', 'dad', 'momlife', 'dadlife', 'family', 'kids'],
  'pets': ['pets', 'dog', 'cat', 'puppy', 'kitten', 'dogsofinstagram', 'catsofinstagram'],
  'minimalism': ['minimalism', 'minimalist', 'simple', 'declutter', 'lessismore'],
  'productivity': ['productivity', 'productive', 'hustle', 'workflow', 'habits'],
  'self-improvement': ['selfimprovement', 'selfdevelopment', 'growth', 'motivation', 'mindset'],

  // ============================================
  // BUSINESS
  // ============================================
  'entrepreneurship': ['entrepreneur', 'entrepreneurship', 'founder', 'ceo', 'business'],
  'marketing': ['marketing', 'digitalmarketing', 'socialmedia', 'branding', 'advertising'],
  'freelancing': ['freelance', 'freelancer', 'freelancelife', 'remotework', 'wfh'],
  'investing': ['investing', 'stocks', 'crypto', 'trading', 'finance', 'wealth'],
  'startups': ['startup', 'startups', 'tech', 'innovation', 'saas', 'funding'],
  'career': ['career', 'job', 'work', 'professional', 'networking', 'linkedin'],
  'side-hustles': ['sidehustle', 'passiveincome', 'makemoney', 'income'],
  'creator-economy': ['creator', 'creatoreconomy', 'contentcreator', 'influencer'],

  // ============================================
  // SCIENCE
  // ============================================
  'space': ['space', 'nasa', 'spacex', 'astronomy', 'cosmos', 'universe', 'rocket'],
  'physics': ['physics', 'quantum', 'science', 'einstein', 'relativity'],
  'biology': ['biology', 'biotech', 'genetics', 'cells', 'evolution', 'nature'],
  'chemistry': ['chemistry', 'chemical', 'lab', 'molecule', 'experiment'],
  'psychology': ['psychology', 'mental', 'brain', 'mind', 'behavior', 'therapy'],
  'environment': ['environment', 'climate', 'sustainability', 'green', 'eco'],
  'history': ['history', 'historical', 'ancient', 'medieval', 'archaeology'],
  'archaeology': ['archaeology', 'archeology', 'ancient', 'ruins', 'excavation'],

  // ============================================
  // NEWS & POLITICS
  // ============================================
  'breaking-news': ['breakingnews', 'news', 'breaking', 'headline', 'latest'],
  'world-news': ['worldnews', 'international', 'global', 'foreign'],
  'politics': ['politics', 'political', 'government', 'election', 'vote'],
  'social-issues': ['socialissues', 'activism', 'justice', 'equality', 'rights'],
  'climate': ['climate', 'climatechange', 'globalwarming', 'environment'],
  'economics': ['economics', 'economy', 'inflation', 'recession', 'markets'],

  // ============================================
  // COMEDY
  // ============================================
  'memes': ['meme', 'memes', 'funny', 'lol', 'humor', 'hilarious'],
  'standup': ['standup', 'standupcomedy', 'comedy', 'comedian', 'jokes'],
  'sketches': ['sketch', 'sketchcomedy', 'skit', 'comedyskit'],
  'satire': ['satire', 'satirical', 'parody', 'spoof'],
  'parody': ['parody', 'spoof', 'impression', 'mockery'],
  'pranks': ['prank', 'pranks', 'prankster', 'gotcha'],

  // ============================================
  // EDUCATION
  // ============================================
  'tutorials': ['tutorial', 'howto', 'learn', 'guide', 'stepbystep'],
  'how-to': ['howto', 'diy', 'tips', 'tricks', 'lifehacks'],
  'language-learning': ['language', 'languages', 'learning', 'polyglot', 'duolingo'],
  'skill-building': ['skills', 'learning', 'education', 'course', 'masterclass'],
  'academic': ['academic', 'university', 'college', 'research', 'study', 'phd'],
  'explainers': ['explainer', 'explained', 'educational', 'knowledge'],
};
