import type { CurriculumId } from '../faqCurriculum';

/** Bit's curriculum answers in English (0.37): 2–4 spoken sentences each. */
export const CURRICULUM_EN: Record<CurriculumId, { q: string; a: string }> = {
  clockSpeed: {
    q: 'What is the clock speed of a processor?',
    a: 'Clock speed is how many work steps a processor makes per second, measured in gigahertz. 3 gigahertz means three billion cycles a second. But speed also depends on the number of cores and on how the processor is built.',
  },
  cores: {
    q: 'What are processor cores?',
    a: 'A core is a separate computing unit inside the processor that runs commands. A multi-core processor does several jobs at once: one core plays music while another opens a website. Today\'s computers usually have 4 to 16 cores.',
  },
  cache: {
    q: 'What is a CPU cache?',
    a: 'Cache is very fast, small memory inside the processor. It keeps the data needed most often, so the processor does not wait for the slower RAM. There are several levels: L1 is the fastest and L3 the largest.',
  },
  bios: {
    q: 'What is the BIOS?',
    a: 'The BIOS, today called UEFI, is a small program on the motherboard that runs first when the computer is switched on. It checks the memory and devices, then starts the operating system. If it finds a fault, the computer beeps.',
  },
  ports: {
    q: 'What types of ports does a computer have?',
    a: 'A port is a socket for a cable. USB is for the mouse, keyboard and flash drive, HDMI and DisplayPort for the monitor, Ethernet for the network, and the 3.5 millimetre jack for headphones. Each port has its own shape, so a plug only fits its own socket.',
  },
  hdmi: {
    q: 'What are HDMI and DisplayPort for?',
    a: 'HDMI and DisplayPort are digital ports that send picture and sound to a monitor or TV. HDMI is common on TVs and projectors, DisplayPort on high refresh gaming monitors. If the computer has a graphics card, plug the monitor into the card\'s port.',
  },
  webcam: {
    q: 'How does a webcam work?',
    a: 'A webcam is an input device that sends video to the computer. Its sensor turns light into an electrical signal, and the computer builds a picture from it. After a lesson or a video call it is wise to cover or switch off the camera.',
  },
  microphone: {
    q: 'How does a microphone record sound?',
    a: 'A microphone is a sound input device. A thin membrane inside vibrates with the sound wave, and the microphone turns those vibrations into an electrical signal. The computer converts the signal into numbers and stores it.',
  },
  speakers: {
    q: 'What do speakers and a sound card do?',
    a: 'Speakers are output devices: they turn an electrical signal into vibrations of the driver, which we hear as sound. The sound card converts digital sound into a signal for the speakers; in most computers it is built into the motherboard.',
  },
  scanner: {
    q: 'What does a scanner do?',
    a: 'A scanner is an input device that turns text or pictures on paper into a digital image. A lamp lights the document strip by strip, and sensors measure the reflected light. Special software can even turn a scanned page into editable text.',
  },
  projector: {
    q: 'How does a projector work?',
    a: 'A projector is an output device that enlarges the computer\'s picture onto a screen or wall. A bright lamp and lenses inside send the picture across the room. In class it is usually connected to the computer with an HDMI cable.',
  },
  touchscreen: {
    q: 'How does a touchscreen work?',
    a: 'A touchscreen is both an input and an output device. A phone screen has an invisible conductive grid, and a finger changes the electric field where it touches. From that change the device works out where you tapped.',
  },
  thermalPaste: {
    q: 'What is thermal paste for?',
    a: 'Thermal paste fills the tiny gaps between the processor and the cooler. Air conducts heat badly and the paste conducts it well, so the processor runs cooler. A pea-sized drop is enough; more does not help.',
  },
  ups: {
    q: 'What is a UPS for?',
    a: 'An uninterruptible power supply, or UPS, uses its battery to keep the computer running for a few minutes when the power suddenly goes out. That gives you time to save your work and shut down properly. It also protects servers and important computers from power surges.',
  },
  opticalDisc: {
    q: 'What is an optical disc?',
    a: 'An optical disc — a CD, DVD or Blu-ray — stores information as tiny pits that a laser reads. A CD holds about 700 megabytes and a DVD 4.7 gigabytes. Today flash drives and cloud storage have taken their place.',
  },
  rom: {
    q: 'What is read only memory?',
    a: 'Read only memory, or ROM, keeps data that is not lost when the computer is switched off. It holds, for example, the BIOS that starts the computer. RAM is temporary: it only works while the computer is on.',
  },
  vonNeumann: {
    q: 'What are the von Neumann principles?',
    a: 'In 1945 John von Neumann described the basic rules of how a computer is built. Both the program and the data are stored in the same memory in binary, and the processor runs the commands one after another. Most computers still follow these principles today.',
  },
  computerHistory: {
    q: 'How did the history of computers begin?',
    a: 'The first electronic computers appeared in the 1940s; ENIAC, for example, filled a whole room. Valves gave way to transistors and then to microchips, and each generation became smaller and faster. A smartphone today is millions of times more powerful than those first machines.',
  },
  supercomputer: {
    q: 'What is a supercomputer?',
    a: 'A supercomputer is an extremely powerful system that joins thousands of processors together. It is used for weather forecasts, space simulations and finding new medicines. Its speed is measured in quadrillions of operations per second.',
  },
  iot: {
    q: 'What is the Internet of Things?',
    a: 'The Internet of Things means everyday devices connected to the internet: smart lights, thermometers, meters and watches. They exchange data and work without a person\'s help. In a smart home, for example, the heater turns itself on when the room gets cold.',
  },
  robotics: {
    q: 'What do I need to know to build a robot?',
    a: 'Robotics combines mechanics, electronics and programming. Sensors are the robot\'s senses, motors its muscles and the controller its brain. At school you can start with LEGO Education or Arduino kits.',
  },
  sensor: {
    q: 'What is a sensor?',
    a: 'A sensor measures something in the world around it and turns it into an electrical signal. There are sensors for temperature, light, distance and motion. Sensors in a phone rotate the screen when you turn the phone.',
  },
  microcontroller: {
    q: 'What is a microcontroller like Arduino?',
    a: 'A microcontroller is a tiny computer on one chip, with a processor, memory and pins for connections. Wire sensors and LEDs to an Arduino board, write a program, and it will measure and control things. It is a great tool for robots and smart devices.',
  },
  printer3d: {
    q: 'How does a 3D printer print?',
    a: 'A 3D printer builds an object layer by layer: a hot nozzle lays down a thin line of melted plastic. First a 3D model is made on the computer, and software slices it into hundreds of thin layers. That is how parts, toys and models are printed.',
  },
  vr: {
    q: 'What is virtual reality?',
    a: 'Virtual reality, or VR, uses a headset to place you inside a three-dimensional world made by a computer. Augmented reality, or AR, adds digital objects on top of the real world. Both are used in learning, games and training doctors.',
  },
  software: {
    q: 'What is software?',
    a: 'Software is all the programs on a computer. System software, such as the operating system and drivers, runs the computer itself. Application software — a browser, a word processor, games — does the user\'s tasks.',
  },
  driver: {
    q: 'What is a driver?',
    a: 'A driver is a small program that teaches the operating system how to work with a particular device. A printer or graphics card does not work properly without one. Get drivers only from the maker\'s official website or from system updates.',
  },
  openSource: {
    q: 'What is open source software?',
    a: 'Open source means anyone can read, change and share the program\'s code. Linux, Firefox, Python and LibreOffice are made this way. Thousands of programmers around the world build such projects together.',
  },
  mobileApp: {
    q: 'How is a mobile app made?',
    a: 'A mobile app is a program for a smartphone or tablet. Android apps are mostly written in Kotlin or Java, iPhone apps in Swift. It is safest to install apps only from the official stores, Google Play and the App Store.',
  },
  textEditor: {
    q: 'What does a word processor do?',
    a: 'A word processor is for typing, editing and formatting documents: fonts, paragraphs, tables and pictures. Microsoft Word, Google Docs and LibreOffice Writer are well-known examples. Save your work often so nothing is lost if the power goes out.',
  },
  presentation: {
    q: 'How do I make a good presentation?',
    a: 'A presentation is a set of slides that makes a talk easy to follow. One idea per slide, a little text and one picture or chart are enough. Choose a large readable font and do not forget a summary slide.',
  },
  graphicsEditor: {
    q: 'What is a graphics editor?',
    a: 'A graphics editor is a program for drawing and editing photos. Paint and GIMP work with pixels, Inkscape with vector shapes. You can change colours, size and brightness and work with layers.',
  },
  vectorRaster: {
    q: 'What is the difference between raster and vector graphics?',
    a: 'A raster image is made of many pixels, so when you zoom in a lot you see little squares: photos are stored this way. A vector image is stored as the formulas of lines and shapes and stays sharp at any size. Logos and drawings are usually vector.',
  },
  shortcuts: {
    q: 'What keyboard shortcuts are useful?',
    a: 'Keyboard shortcuts make work much faster. Ctrl+C copies, Ctrl+V pastes, Ctrl+Z undoes the last action and Ctrl+S saves the document. Alt+Tab switches between windows.',
  },
  compiler: {
    q: 'What is the difference between a compiler and an interpreter?',
    a: 'A computer only understands machine code, so a program has to be translated. A compiler translates the whole program once in advance, as in C++. An interpreter reads the code line by line and runs it straight away, which is how Python works.',
  },
  information: {
    q: 'What is information?',
    a: 'Information is what we know about the world: text, numbers, pictures, sound or video. Good information is true, complete, up to date, clear and useful. A computer stores, processes and passes on information.',
  },
  informationAmount: {
    q: 'How is the amount of information measured?',
    a: 'The amount of information is measured in bits. By Hartley\'s formula, choosing one of N equal options gives i bits, where 2 to the power i equals N. Choosing one of 8 options, for example, is 3 bits, because 2 cubed is 8.',
  },
  numberSystems: {
    q: 'What number systems are there?',
    a: 'A number system is a way of writing numbers with symbols. In a positional system a digit\'s value depends on its place: decimal has ten digits, binary two and hexadecimal sixteen symbols. Roman numerals are an example of a non-positional system.',
  },
  octal: {
    q: 'What is the octal number system?',
    a: 'Octal uses only the digits 0 to 7, and each place is a power of eight. Every octal digit matches exactly three binary digits: octal 5, for example, is 101 in binary. That makes octal a short way to write binary code.',
  },
  toBinary: {
    q: 'How do I convert a number to binary?',
    a: 'To convert a number to binary, keep dividing it by 2 and write down each remainder. When the quotient reaches zero, read the remainders from last to first. For 13: 6 remainder 1, 3 remainder 0, 1 remainder 1, 0 remainder 1, so 1101.',
  },
  colorModel: {
    q: 'How does the RGB colour model work?',
    a: 'Every pixel on a screen mixes three colours: red, green and blue, or RGB. Each brightness is a number from 0 to 255, which is one byte. So a pixel takes 3 bytes and gives over 16 million colours, while printers use the CMYK model.',
  },
  sound: {
    q: 'How is digital sound made?',
    a: 'To digitise sound, the computer measures the height of the sound wave thousands of times a second; this is called sampling. Music is usually sampled 44,100 times a second. The more often and more precisely it is measured, the better the sound, but the more space it takes.',
  },
  video: {
    q: 'How is video stored, and what is frame rate?',
    a: 'Video is a series of pictures, called frames, shown quickly one after another. Usually 24 to 60 frames are shown per second, and the eye sees smooth motion. Video takes a lot of space, so it is compressed in formats like MP4.',
  },
  truthTable: {
    q: 'What is a truth table?',
    a: 'A truth table shows what a logical expression gives for every possible combination of inputs. AND gives 1 only when both inputs are 1, OR gives 1 when at least one is 1, and NOT flips the value. With two inputs the table has 4 rows.',
  },
  flowchart: {
    q: 'What is a flowchart?',
    a: 'A flowchart shows an algorithm with shapes. An oval marks the start and end, a rectangle an action, a diamond a condition and a parallelogram input or output. Arrows join the shapes and show the order of the steps.',
  },
  algorithmTypes: {
    q: 'What types of algorithm are there?',
    a: 'There are three basic types of algorithm. In a linear algorithm the steps follow one another, in a branching one a condition chooses one of two paths, and in a loop the steps repeat. Real programs combine all three.',
  },
  sorting: {
    q: 'Why do we need a sorting algorithm?',
    a: 'Sorting puts data in order: numbers from smallest to largest, words alphabetically. Searching a sorted list is much faster. Well-known methods are bubble sort, selection sort, insertion sort and quicksort.',
  },
  bubbleSort: {
    q: 'How does bubble sort work?',
    a: 'Bubble sort compares neighbouring elements and swaps them if they are in the wrong order. After each pass the largest element rises to the end of the list like a bubble. It is simple but slow on long lists.',
  },
  binarySearch: {
    q: 'How does binary search work?',
    a: 'Binary search only works on a sorted list. Look at the middle element: if the number you want is smaller, go to the left half, if larger, to the right half. The list halves every step, so you find an item among a thousand in about 10 steps.',
  },
  recursion: {
    q: 'What is recursion?',
    a: 'Recursion is when a function calls itself. Factorial 5, for example, is 5 times factorial 4, which is 4 times factorial 3, and so on down to one. A recursive function must have a stopping condition, or it never ends.',
  },
  executor: {
    q: 'What is an executor?',
    a: 'An executor is a person, robot or program that can carry out a set of commands. The Turtle, for example, draws with commands like "forward", "turn right" and "pen down". The list of commands an executor understands is its command system.',
  },
  python: {
    q: 'What is the Python language?',
    a: 'Python is the programming language most often taught at school. It is short and readable: print("Hello") shows "Hello" on the screen. Python is used for games, websites, data analysis and artificial intelligence.',
  },
  print: {
    q: 'What does the print function do?',
    a: 'The print function shows text or a value on the screen. print("Result:", 2 + 3), for example, writes "Result: 5". Values separated by commas are printed with spaces between them.',
  },
  input: {
    q: 'How does the input function work?',
    a: 'The input function gets the text a user types on the keyboard. name = input("What is your name? ") asks the question and stores the answer in the variable name. input always returns text, so for a number write int(input()).',
  },
  dataTypes: {
    q: 'What data types are there?',
    a: 'The main data types in Python are int for whole numbers, float for decimals, str for text and bool for true or false. 7 is an int, 3.14 a float and "hello" a string. You can check a variable\'s type with type().',
  },
  list: {
    q: 'What is a list in Python?',
    a: 'A list keeps several values in order in one variable, for example a = [5, 8, 2]. Positions start at zero, so a[0] is 5. append() adds an element at the end, and len(a) gives the number of elements.',
  },
  string: {
    q: 'How do I work with strings?',
    a: 'A string is text in quotes, for example s = "computing". Strings can be joined with a plus sign, and a slice like s[0:4] takes part of one. upper() makes the letters capital, and len(s) gives the length.',
  },
  function: {
    q: 'What is a function?',
    a: 'A function is a named piece of code you can call again and again. In Python it starts with the word def, and return sends back the result: a square function, for example, can return a number squared. Functions make a program shorter and clearer and save you repeating code.',
  },
  forLoop: {
    q: 'How do a for loop and range work?',
    a: 'A for loop repeats an action a set number of times. In for i in range(5), the variable i takes the values 0 to 4 in turn. range(1, 11) gives the numbers 1 to 10; the last number is not included.',
  },
  whileLoop: {
    q: 'When is a while loop used?',
    a: 'A while loop repeats as long as its condition is true. while x < 10, for example, runs until x reaches 10. If the condition never becomes false, the loop never ends, so remember to change the variable inside it.',
  },
  operators: {
    q: 'How are arithmetic operators written?',
    a: 'Python has signs for adding, subtracting, multiplying and dividing; multiplication is written with an asterisk. A double slash gives integer division: 17 divided by 5 this way is 3, and the percent sign gives the remainder: 17 % 5 is 2. A double asterisk raises to a power: 2 to the power 10 is 1024.',
  },
  syntaxError: {
    q: 'What should I do about a syntax error?',
    a: 'A syntax error appears when a rule of the language is broken: a bracket is not closed, a colon is missing or a word is misspelt. The error message gives the line number, so check that line and the one before it carefully. Errors are a normal part of learning, and each one you fix makes you stronger.',
  },
  indentation: {
    q: 'Why does indentation matter in Python?',
    a: 'In Python, indentation shows where a block of code starts and ends. After if, for, while and def comes a colon, and the next lines move in by four spaces. Wrong indentation gives an IndentationError.',
  },
  lanWan: {
    q: 'What is the difference between LAN and WAN?',
    a: 'A local area network, or LAN, joins the devices in one room, school or home. A wide area network, or WAN, links cities and countries, and the biggest WAN of all is the internet. A network across a city is sometimes called a MAN.',
  },
  topology: {
    q: 'What is a topology in networking?',
    a: 'A topology is the layout of how devices in a network are connected. In a star every computer connects to one switch, in a bus they all share one cable, and in a ring they are linked in a chain. The star is the most common today, because if one cable breaks the rest keep working.',
  },
  protocol: {
    q: 'What is a protocol in networking?',
    a: 'A protocol is a set of shared rules for how devices send and receive data. TCP makes sure data arrives complete and in order, and IP gives each packet its address. HTTP delivers websites and SMTP delivers email.',
  },
  https: {
    q: 'What is the difference between HTTP and HTTPS?',
    a: 'HTTP is the protocol that brings websites to your browser. HTTPS sends the same data encrypted, so a stranger cannot read your password or card number. The padlock in the address bar means the connection is encrypted, but it does not prove the site is honest.',
  },
  mac: {
    q: 'What is a MAC address?',
    a: 'A MAC address is the physical address every network card gets at the factory, for example 3C:52:82:1A:7F:0D. A switch delivers data inside one network by this address. An IP address is given when a device joins a network and can change.',
  },
  dhcp: {
    q: 'What is DHCP?',
    a: 'DHCP is the protocol that gives a device an IP address automatically when it joins a network. When you connect your phone to home Wi-Fi, the router gives it an address, a subnet mask and a gateway by itself. Without DHCP every device would need its address typed in by hand.',
  },
  ping: {
    q: 'What does the ping command show?',
    a: 'Ping sends a small packet to another device and waits for the reply. If the reply comes back, the connection works, and the delay is shown in milliseconds. In games, the lower your ping, the faster the game responds.',
  },
  ethernetCable: {
    q: 'How is an Ethernet cable made?',
    a: 'Inside an Ethernet cable are four pairs of copper wires twisted together, which is why it is called twisted pair. The twisting reduces electrical interference. At the end is an RJ-45 plug that clicks into the network port of a computer or router.',
  },
  fiber: {
    q: 'How does fibre optic cable work?',
    a: 'An optical fibre is a glass thread thinner than a hair that carries data as pulses of light. The light bounces off the walls of the fibre and travels hundreds of kilometres without fading. That is why fibre is much faster and reaches much further than copper cable.',
  },
  bandwidth: {
    q: 'How is internet speed measured?',
    a: 'Internet speed is measured in bits per second, usually megabits per second. Remember a byte is eight bits, so 100 megabits per second is about 12 megabytes per second. Distance from the router and the number of connected devices also affect speed.',
  },
  mobileNetwork: {
    q: 'How do 4G and 5G mobile networks work?',
    a: 'A mobile network works through base stations on masts, each covering its own area. 4G is fast enough for video, and 5G is faster still with a very small delay. While you travel, the phone moves from one station to the next without dropping the connection.',
  },
  phishing: {
    q: 'What is phishing?',
    a: 'Phishing is when scammers trick you into giving your password or card details through fake messages and websites. The message may look as if it came from a bank, a game or your school, and the link leads to a copy of the real site. Do not click, check the address and show the suspicious message to an adult.',
  },
  twoFactor: {
    q: 'What is two factor authentication?',
    a: 'Two-factor authentication asks for a second proof besides your password: a text message code or a code from an app. Then even if someone learns your password, they cannot get in without your phone. Turn it on for your email and social media.',
  },
  firewall: {
    q: 'What does a firewall do?',
    a: 'A firewall checks the network traffic coming into and going out of a computer. It blocks unauthorised connections and stops suspicious programs from reaching the network. Together with an antivirus it makes your protection stronger.',
  },
  personalData: {
    q: 'How do I protect my personal data?',
    a: 'Personal data is your name, address, phone number, school, photos and documents. Do not share them with strangers, in open chats or on suspicious websites. On social media make your profile private and choose who can see what.',
  },
  socialEngineering: {
    q: 'What is social engineering?',
    a: 'Social engineering is when a scammer fools a person rather than a program. They pretend to be a friend, a teacher or a bank worker and hurry you into telling them a code or password. Remember: never share a text message code with anyone, not even "support".',
  },
  spam: {
    q: 'What is spam?',
    a: 'Spam is mass messages and emails you never asked for, usually adverts or scams. Do not open the links in spam or reply, even if it says "unsubscribe". The Spam button in your inbox trains the filter, so next time such messages go away on their own.',
  },
  hacker: {
    q: 'What should I do if my account was hacked?',
    a: 'If your account has been hacked, change the password at once and turn on two-factor protection. If you used the same password elsewhere, change it there too. Warn your friends not to open messages sent in your name, and tell a parent or teacher what happened.',
  },
  publicWifi: {
    q: 'Is public Wi-Fi safe?',
    a: 'On open Wi-Fi in a café or a station, a stranger might see your data. On such a network do not log in to a bank, do not type passwords and use only HTTPS sites. If you can, mobile data is safer.',
  },
  bigData: {
    q: 'What is big data?',
    a: 'Big data means huge amounts of information that ordinary programs cannot handle: millions of purchases, traffic data, social media posts. Special systems and artificial intelligence analyse them to find patterns. Traffic jams, for example, can be predicted and traffic lights tuned.',
  },
  chart: {
    q: 'Which chart should I use and when?',
    a: 'A chart makes numbers easy to see. A bar chart compares values, a line chart shows change over time, and a pie chart shows parts of a whole. In a spreadsheet, select the data and click "Insert chart".',
  },
  formula: {
    q: 'How do I write a spreadsheet formula?',
    a: 'A formula always starts with an equals sign, for example =A1+B1. =SUM(A1:A10) adds up ten cells and =AVERAGE finds the mean. When a number in a cell changes, the formula recalculates by itself.',
  },
  sortFilter: {
    q: 'How do I filter data in a table?',
    a: 'Sorting puts the rows of a table in order by one column, for example marks from highest to lowest. A filter temporarily hides rows that do not match a condition, for example showing only year 7 pupils. Both are in the Data menu.',
  },
  machineLearning: {
    q: 'What is machine learning?',
    a: 'In machine learning, nobody writes rules for the computer; instead it is shown many examples. A model that has seen thousands of photos of cats and dogs starts telling them apart in new photos on its own. The more and better the examples, the more accurate the model.',
  },
  chatbot: {
    q: 'How does a chatbot answer?',
    a: 'Inside a chatbot is a language model: it learned from millions of texts and builds an answer by predicting the next word. So even when it sounds sure, it can be wrong or make things up. Always check important facts with a reliable source.',
  },
  aiEthics: {
    q: 'Can I do my homework with AI?',
    a: 'Artificial intelligence can explain, give examples and check your work, but if it does the work for you, you learn nothing. Do not copy its answer word for word: understand it and write in your own words. Telling your teacher that AI helped you is the honest thing to do.',
  },
  deepfake: {
    q: 'What is a deepfake?',
    a: 'A deepfake is a fake video or voice made by artificial intelligence, so a person seems to say things they never said. Look for lips that do not match the sound, odd blinking and blurry edges around the face. Do not believe a shocking video at once; look for an official source.',
  },
  computerVision: {
    q: 'What is computer vision?',
    a: 'Computer vision is a computer\'s ability to recognise objects, letters and faces in pictures and video. It is used for face recognition on phones, cars that read road signs and programs that help doctors. It, too, learns from thousands of images through machine learning.',
  },
  netiquette: {
    q: 'What is netiquette?',
    a: 'Netiquette means the rules of good manners online. Be polite, respect other opinions and do not write in capital letters only, which looks like shouting. Do not share someone else\'s photos or messages without permission.',
  },
  fakeNews: {
    q: 'How can I spot fake news?',
    a: 'Fake news often spreads with a frightening or amazing headline and no author or date. Check the story with several reliable sources, and use a reverse image search to see where a photo first appeared. If in doubt, do not share it.',
  },
  screenTime: {
    q: 'How does screen time affect health?',
    a: 'Looking at a screen for a long time tires the eyes, and sitting for long hurts the back and neck. Follow the 20-20-20 rule: every 20 minutes look 6 metres away for 20 seconds. Put the phone away an hour before sleep and limit games in the evening.',
  },
  eGov: {
    q: 'What is e-government?',
    a: 'E-government, eGov.kz in Kazakhstan, lets people use public services online: getting certificates or enrolling in a kindergarten or school. You sign in with an electronic digital signature or a text message code. A digital signature is a way to sign official documents, so never give it to anyone.',
  },
  qrCode: {
    q: 'How does a QR code work?',
    a: 'A QR code is a two-dimensional code that stores information as black and white squares. A phone camera reads it and opens a link, text or payment details. Be careful with QR codes stuck up in unfamiliar places: they can lead to a fake site.',
  },
  socialNetwork: {
    q: 'How do I stay safe on social media?',
    a: 'What you post on social media can stay there forever, so think before you post. Make your profile private, do not accept friend requests from strangers and do not show your location. If someone threatens or bullies you, take a screenshot and tell an adult.',
  },
  digitalLiteracy: {
    q: 'What is digital literacy?',
    a: 'Digital literacy is being able to use digital devices and the internet well and safely. It includes finding and checking information, protecting data, communicating politely and creating digital content. It is a skill every job needs.',
  },
};
