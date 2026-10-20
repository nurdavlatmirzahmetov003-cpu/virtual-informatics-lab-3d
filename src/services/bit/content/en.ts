import { CURRICULUM_EN } from './curriculum.en';
import type { BitContent } from './types';

const en: BitContent = {
  faq: {
    ...CURRICULUM_EN,
    computer: {
      q: 'What is a computer?',
      a: 'A computer is a device that takes in information, processes it, stores it and shows the result. Its main parts are the processor, the memory, the storage drive, the motherboard and the power supply. Programs tell it what to do.',
    },
    cpu: {
      q: 'What is a processor?',
      a: 'The processor is the brain of the computer. It carries out program instructions billions of times per second. Its speed depends on the number of cores and on the clock speed, measured in gigahertz. A six-core processor, for example, handles several tasks at once with ease.',
    },
    ram: {
      q: 'What is RAM for?',
      a: 'RAM, the main memory, holds the data the processor is working on right now. It is very fast, but everything in it is lost when the computer turns off. The more memory you have, the more programs you can keep open: 8 gigabytes is enough for school work, 16 for games.',
    },
    storage: {
      q: 'What is the difference between an SSD and an HDD?',
      a: 'Files are kept for the long term on a hard disk drive, an HDD, or on an SSD. An HDD has spinning magnetic platters inside: it is cheap and large, but slow. An SSD is made of memory chips with no moving parts, so it is many times faster. With the system on an SSD, a computer starts in a few seconds.',
    },
    gpu: {
      q: 'What does a graphics card do?',
      a: 'The graphics card draws the picture you see on the screen. It has its own processor and memory and runs thousands of simple calculations in parallel. That is why games, 3D modelling and video editing need a powerful graphics card.',
    },
    motherboard: {
      q: 'What is a motherboard?',
      a: 'The motherboard is the main board that connects every part of the computer. The processor, memory, graphics card and drives plug into it, and they talk to each other through it. When you choose parts, the processor socket and the memory type must match the board.',
    },
    psu: {
      q: 'What is a power supply for?',
      a: 'The power supply turns the 230-volt alternating current from the socket into the steady 12, 5 and 3.3 volts a computer needs. Its rating should be about 20 to 30 percent above what all the parts use together.',
    },
    cooling: {
      q: 'Why does a computer need cooling?',
      a: 'The processor and the graphics card heat up while they work. The cooling system — a heatsink, fans or liquid cooling — carries that heat away. If the temperature gets too high, the processor slows down, and if it keeps rising, the computer shuts itself off.',
    },
    os: {
      q: 'What is an operating system?',
      a: 'The operating system is the main program that runs the computer’s hardware and other programs. It shares out memory, stores files and lets us work with windows and icons. Windows, macOS, Linux and Android on your phone are all operating systems.',
    },
    binary: {
      q: 'What is the binary number system?',
      a: 'A computer stores all data in binary, using only 0 and 1. Each digit is a power of two: 1, 2, 4, 8 and so on. For example, 1011 is 8 plus 2 plus 1, which is 11 in decimal.',
    },
    bitByte: {
      q: 'What are bits and bytes?',
      a: 'A bit is the smallest unit of information: it is either 0 or 1. Eight bits make one byte, enough to store one letter. 1024 bytes make a kilobyte, and 1024 kilobytes make a megabyte.',
    },
    algorithm: {
      q: 'What is an algorithm?',
      a: 'An algorithm is an exact sequence of steps that reaches a goal. Making tea is an algorithm too: boil the water, put tea in the pot, pour, wait. A programmer turns an algorithm into a language the computer understands, and that is a program.',
    },
    programming: {
      q: 'How do I start programming?',
      a: 'A programming language is a way to tell a computer what to do. Python is a good place to start: it is simple and reads almost like English. Websites are written in JavaScript, and large systems often in Java or C++.',
    },
    network: {
      q: 'What is a computer network?',
      a: 'A computer network is a group of devices joined by cables or radio so they can exchange data. The computers in one classroom form a local network, and the internet is the biggest network of all, joining millions of networks around the world. Every device on a network has its own IP address.',
    },
    internet: {
      q: 'How does the internet work?',
      a: 'The internet is a global network that joins millions of networks around the world. Data is split into small packets that travel through routers along the best available path. Everything follows one shared set of rules, the TCP/IP protocols.',
    },
    ip: {
      q: 'What is an IP address?',
      a: 'An IP address is a unique number for each device on a network, like a postal address. An IPv4 address is four numbers separated by dots, for example 192.168.1.10. Devices on the same network share the network part of the address, and the subnet mask says which part that is.',
    },
    router: {
      q: 'What does a router do?',
      a: 'A router connects different networks, for example your home network to the internet. It looks at the address on every packet and decides where to send it next. A home router usually hands out IP addresses to your devices as well.',
    },
    switch: {
      q: 'What is a switch for?',
      a: 'A switch connects the computers of one network by cable. It remembers the MAC address of every device and sends data only to the port that needs it. Connecting different networks together is the router’s job.',
    },
    wifi: {
      q: 'How does Wi-Fi work?',
      a: 'Wi-Fi sends data without wires, over radio waves. The router broadcasts a network and phones and laptops join it with a password. Always protect your network with WPA2 or WPA3 encryption and a strong password.',
    },
    password: {
      q: 'What makes a strong password?',
      a: 'A strong password has at least 12 characters, mixing capital and small letters, numbers and symbols. Never use your birthday, your name or easy ones like 123456. Use a different password for every site and never share it.',
    },
    safety: {
      q: 'How do I stay safe online?',
      a: 'Be careful online: never give strangers your address, your phone number or your passwords. Do not open suspicious links and do not trust offers that look too good to be true — that may be phishing. If something feels wrong, tell a parent or your teacher.',
    },
    virus: {
      q: 'What is a computer virus?',
      a: 'A computer virus is a harmful program that copies itself, damages files or steals data. To stay protected, install an antivirus and system updates and download programs only from official websites. Keep backups of your important files.',
    },
    cloud: {
      q: 'What is the cloud?',
      a: 'The cloud means your files and programs live on distant servers on the internet instead of on your own computer. A document saved in the cloud opens from any device. You do need an internet connection to reach it.',
    },
    inputOutput: {
      q: 'What are input and output devices?',
      a: 'Input devices give information to the computer: the keyboard, mouse, microphone, webcam and scanner. Output devices show the result: the monitor, printer, speakers and headphones. A touch screen does both.',
    },
    monitor: {
      q: 'How do I choose a monitor?',
      a: 'Three numbers describe a monitor. Resolution is the number of dots on the screen, for example 1920 by 1080. The refresh rate is measured in hertz: a 144-hertz monitor redraws the picture 144 times a second. The third is the panel type: IPS panels show colours accurately.',
    },
    ai: {
      q: 'What is artificial intelligence?',
      a: 'Artificial intelligence means programs that learn from examples to understand text, recognise images or suggest decisions. I use that kind of technology to answer your questions. AI can make mistakes, though, so always check important facts.',
    },
    file: {
      q: 'What are files and folders?',
      a: 'A file is a named piece of data on a disk: a text, a picture, a song or a program. The extension after the name shows its type: .docx is a document, .png is an image. We keep files tidy by putting them into folders.',
    },
    who: {
      q: 'Who are you?',
      a: 'I am Bit, the robot assistant of the {brand} lab. I can explain informatics topics, open any part of the site and take you through a lesson step by step. I can even build a computer for your budget. Try saying: “Bit, show me the site”.',
    },
    help: {
      q: 'What can you do?',
      a: 'Say it or type it, for example: “Bit, what is a processor?”, “Bit, open the networks lab”, “Bit, start the logic lesson”, “Bit, build a PC for 500,000 tenge” or “Bit, show me the site”. I always answer in the language of the site.',
    },
    progress: {
      q: 'Where can I see my results?',
      a: 'Your results are on the “My results” page: finished tasks, points, XP, your level and achievements. When you sign in, your results are saved on the server and your teacher can see them too.',
    },
    keyboard: {
      q: 'How does a keyboard work?',
      a: 'A keyboard lets you type text and commands. When you press a key, a contact under it closes and the computer receives that key’s code. Ctrl, Alt and Shift together with other keys give shortcuts: Ctrl and C, for example, copy text.',
    },
    mouse: {
      q: 'How does a computer mouse work?',
      a: 'A tiny camera under the mouse photographs the desk thousands of times a second and works out how it moves. The computer moves the pointer on the screen to match. The left button selects, the right button opens a menu, and the wheel scrolls.',
    },
    printer: {
      q: 'How does a printer print?',
      a: 'An inkjet printer sprays tiny drops of ink onto the paper. A laser printer draws the image with light on a drum, picks up toner powder there and fuses it onto the paper with heat. Laser printers print text quickly and cheaply, while inkjets are good for colour photos.',
    },
    usb: {
      q: 'What is USB?',
      a: 'USB is a universal port for plugging in devices: flash drives, mice, keyboards and phones. It carries both data and power. The modern USB-C plug fits either way round and can even charge a laptop.',
    },
    bluetooth: {
      q: 'How does Bluetooth work?',
      a: 'Bluetooth is a short-range radio link for nearby devices, usually up to about 10 metres. Headphones, mice, speakers and phones connect through it. The first time, you pair the devices; after that they find each other on their own.',
    },
    laptop: {
      q: 'How is a laptop different from a desktop PC?',
      a: 'A laptop packs the screen, keyboard, battery and every part into one compact case, so you can carry it anywhere. A desktop tower is bigger, but its parts are easy to replace and it stays cooler. That is why gamers and heavy work usually go for a desktop.',
    },
    smartphone: {
      q: 'Is a smartphone a computer too?',
      a: 'Yes, a smartphone is a small computer. It has a processor, memory, storage and an operating system too, all packed onto one small board. It uses very little power, so the battery lasts a long time.',
    },
    server: {
      q: 'What is a server?',
      a: 'A server is a powerful computer that serves other computers: it stores websites, email, games and files and answers requests. It runs day and night without switching off. When thousands of servers share one building, it is called a data centre.',
    },
    encryption: {
      q: 'What is encryption?',
      a: 'Encryption turns information into a secret code that only someone with the key can read. If a website address starts with https and shows a padlock, your data travels encrypted. So only type your password on sites with the padlock.',
    },
    backup: {
      q: 'Why do I need a backup?',
      a: 'A backup is a copy of your important files kept somewhere else: on a flash drive, an external disk or in the cloud. If a disk breaks, a virus strikes or you delete something by mistake, you restore it from the copy. Back up your important work regularly.',
    },
    update: {
      q: 'Why should I install updates?',
      a: 'Updates fix mistakes in programs and close the holes hackers could use. Sometimes they add new features too. Keep your operating system and browser up to date, but only get updates from official sources.',
    },
    browser: {
      q: 'What is a web browser?',
      a: 'A browser is the program that opens websites: Chrome, Edge, Firefox or Safari. It downloads a page’s code from a server and shows it as text, pictures and buttons. Our {brand} lab runs in the browser too.',
    },
    searchEngine: {
      q: 'How does a search engine work?',
      a: 'A search engine’s programs visit billions of pages in advance and record what is on them in a huge index. When you type a query, it looks up the most useful pages in that index and puts them at the top. Use precise keywords to find things faster.',
    },
    email: {
      q: 'How does email work?',
      a: 'Email sends your message to a mail server, which delivers it to the recipient’s server. Every address has an @ sign: the user’s name comes before it and the mail service’s domain after it. Never open links or files in emails from strangers.',
    },
    cyberbullying: {
      q: 'What is cyberbullying?',
      a: 'Cyberbullying is insulting, threatening or mocking someone online. Do not answer back: save a screenshot, block the person and always tell a parent or teacher. And never hurt anyone online yourself — there is a real person on the other side of the screen.',
    },
    digitalFootprint: {
      q: 'What is a digital footprint?',
      a: 'Your digital footprint is everything about you that stays online: posts, photos, comments and searches. Once something is published it is very hard to remove, and teachers or employers may see it later. So think before you post.',
    },
    copyright: {
      q: 'What is copyright?',
      a: 'Copyright is the right of the person who made a book, song, film or program to decide how it is used. Copying and sharing it without permission is illegal; that is called piracy. There are also openly licensed works you may use for free and legally.',
    },
    spreadsheet: {
      q: 'What is a spreadsheet for?',
      a: 'A spreadsheet such as Excel holds numbers and text in cells and calculates with formulas. Change one number and every result that depends on it updates by itself. It is great for adding up marks or expenses and for making charts.',
    },
    database: {
      q: 'What is a database?',
      a: 'A database stores a lot of information in order: for example every student in a school and their marks. The data sits in tables, and a query language such as SQL finds what you need in seconds. Our site keeps students’ results in a database too.',
    },
    variable: {
      q: 'What is a variable?',
      a: 'A variable is a named box where a program keeps a value. A variable called score, for example, starts at 0 and gets 10 added after every right answer. Its value can change while the program runs.',
    },
    loop: {
      q: 'What is a loop?',
      a: 'A loop is the part of a program that repeats an action several times. A loop like “repeat 10 times: step forward” walks a robot ten steps. Without a loop you would have to write the same command ten times.',
    },
    condition: {
      q: 'What is an if statement?',
      a: 'An if statement lets a program make a decision: if a condition is true, it does one thing, otherwise another. For example, if the score is over 50, print “Well done!”, else print “Try again”. In Python it is written with the words if and else.',
    },
    bug: {
      q: 'What is a bug in a program?',
      a: 'A bug is a mistake in a program that makes it work wrongly. To find it, a programmer runs the program step by step and checks the values of the variables — that is called debugging. Finding bugs is one of a programmer’s most important skills.',
    },
    website: {
      q: 'How is a website made?',
      a: 'A website is written in three languages: HTML for the content, CSS for the look and JavaScript for buttons and animation. The finished files are put on a server and published on the internet. Start by making a simple HTML page and opening it in your browser.',
    },
    domain: {
      q: 'What are a domain and a URL?',
      a: 'A domain is a website’s human-friendly name, such as example.kz. A URL is the full address of one page, with the protocol, the domain and the page’s path. The browser looks up the domain’s IP address in a service called DNS.',
    },
    logicGates: {
      q: 'What are logic gates?',
      a: 'A logic gate is a tiny circuit that works with signals of 0 and 1. AND gives 1 only when both inputs are 1, OR needs just one input to be 1, and NOT turns the signal into its opposite. A processor is made of billions of gates — build them yourself in the logic lab.',
    },
    hexadecimal: {
      q: 'What is hexadecimal?',
      a: 'Hexadecimal has 16 digits: the numbers 0 to 9 and the letters A to F. One hexadecimal digit equals four binary bits, so long binary numbers can be written briefly. On websites, red is written as FF0000.',
    },
    encoding: {
      q: 'What is text encoding?',
      a: 'A computer stores letters as numbers: every character has its own number. The old ASCII table had only English letters, while Unicode covers every alphabet in the world, including the Kazakh letters ә, ғ, қ, ң, ө, ұ, ү, һ and і. Websites and documents are usually saved in UTF-8.',
    },
    pixel: {
      q: 'What is a pixel?',
      a: 'A pixel is the smallest coloured dot on a screen or in an image. Each pixel’s colour is a mix of red, green and blue. The more pixels, the sharper the picture: a Full HD screen has more than two million of them.',
    },
    compression: {
      q: 'What is file compression?',
      a: 'Compression makes a file smaller by writing repeated parts in a shorter way. A ZIP archive compresses without losing anything, while JPEG photos and MP3 songs drop details your eyes or ears hardly notice. A compressed file is sent faster and takes less space.',
    },
  },
  tourIntro: 'Great, let’s walk through the site together! I will stop in every section and tell you what you can do there. To move on, press “Next” or say “next”.',
  tour: {
    home: 'This is the home page with a 3D desk. Scroll down and the computer comes apart, telling you about each of its parts.',
    lab: 'This is the 3D lab, our big classroom. It has ten zones: PC building, networks, peripherals, the BitLab stage and more. Click a zone and the camera flies there; click a device to turn it around and see it from every side.',
    explorer: 'In Anatomy every device is shown close up: its name, what it is for and its key specs. Each one ends with a short three-question test.',
    labs: 'This is the list of labs: PC assembly, networks, algorithms, logic, experiments, cable connections and cause and effect. Every task is graded automatically.',
    studio: 'In Setup Studio you pick a purpose and a budget and build your own computer. The studio checks that the parts fit together. Tell me “build a PC for 500,000 tenge” and I will help.',
    tasks: 'The Tasks page collects the tasks of every lab in one place. Use the filter to find the ones you have not done and start right away.',
    progress: 'My results shows your points, your level, your achievements and the next task I recommend.',
    live: 'In Live games the whole class plays quizzes and races: who builds a PC fastest, who finds the fault first. That is the end of the tour! Ask me anything, any time — type or just talk.',
  },
  lessons: {
    network: [
      'Let’s start the networks lesson! Today we will put two computers on a network and check that they can see each other. First pick a task at the top or open Free build mode.',
      'Drag two PCs and one switch from the Devices list onto the workspace. Then click a computer’s port and pull the cable to a port on the switch.',
      'Now click each computer and type its IP address. Devices on one network have similar addresses: for example 192.168.1.10 and 192.168.1.11, with the mask 255.255.255.0.',
      'The last step is PING. Send a ping from one computer to the other and watch the packet travel. If it arrives, your network works. If not, check the cables and the IP addresses.',
    ],
    logic: [
      'Welcome to the logic lesson! Logic gates work with 0 and 1: AND, OR and NOT. First choose a task or open Free build.',
      'Drag the gate you need from the Gates list onto the workspace. To draw a wire, press a gate’s output on the right and drag it to another gate’s input on the left.',
      'Now click the inputs A, B and C to switch them between 0 and 1. Wires carrying a 1 glow, and the truth table fills itself in.',
      'When the circuit is ready, press Check. The site tries every combination of inputs and gives you a score. If something is wrong, compare your truth table with the one in the task.',
    ],
    algorithms: [
      'Let’s start the algorithms lesson! Here you see every step of searching and sorting algorithms. First pick an algorithm from the list, for example bubble sort.',
      'Press play and watch the bars swap places. You can change the speed, pause and step back.',
      'Under every step it says what is happening and why. The current line of pseudocode is highlighted — read it carefully.',
      'At the end there is a short quiz: guess how many comparisons the algorithm makes or what happens next. Correct answers add to your score.',
    ],
    assembly: [
      'Welcome to the PC assembly lesson! In eleven steps you build a computer with your own hands. Pick a part up with the mouse, carry it to its place and let go when the see-through ghost appears.',
      'First put the motherboard on the mat, then fit the processor, the cooler and the memory. The order matters: the processor goes in before the cooler.',
      'Once the board is in the case, add the graphics card, the SSD and the power supply. If you get stuck, the Hint button shows the next step, but it costs one point.',
      'When everything is in place, switch the computer on! Your time, mistakes and hints are counted. Build it faster and without mistakes to beat your record.',
    ],
    connect: [
      'Let’s start the cable lesson. Here you plug the monitor, keyboard, mouse and power cables into the right sockets.',
      'Grab the end of a cable with the mouse and bring it to a matching port. A plug will not go into a socket of another shape, so learn the port types: HDMI, DisplayPort, USB and Ethernet.',
      'If the computer has a graphics card, plug the monitor into the graphics card, not into the motherboard. This is the most common mistake.',
      'In the next tasks you connect a laptop to the network, first with a cable and then over Wi-Fi. Choose a secure network: one with WPA2 or WPA3 encryption.',
    ],
    sim: [
      'Welcome to the cause and effect lab! Here you take one part out of a computer and see what happens.',
      'Choose the parts and switch the computer on. Without memory it beeps, and with no graphics card and no built-in graphics the screen stays dark.',
      'Run the stress test and watch the temperature and the power. With a weak cooler the processor slows down when it reaches 95 degrees.',
      'In the repair task the computer has a fault: read the symptoms, find the cause and swap the right part. Check your guess under “What happened?”.',
    ],
    experiments: [
      'Let’s start the experiments lesson! In every experiment you change one value and see the result at once.',
      'Pick an experiment from the list. First read “What are we exploring?” — it tells you the goal.',
      'Change the values with the sliders and buttons and watch the chart change. This is a teaching simulation; its numbers are close to real devices.',
      'At the end read “What did we see, and why?” and answer the mini quiz. If every answer is right, the task counts as done.',
    ],
    explorer: [
      'Let’s start the computer anatomy lesson. Choose a category at the top: external devices or internal components.',
      'Let me open the monitor for you: the camera has moved in and the panel shows its name, its purpose and its key specs. Try clicking any other device too.',
      'Now on to the internal components: I am showing you the processor. Turn it with the mouse and look at it from every side, and if a spec is unclear, ask me.',
      'Every device has a mini test of three questions. Pass it and move on to the next device.',
    ],
    studio: [
      'Welcome to the Setup Studio lesson! Today you build your own computer. First choose what it is for: study, gaming, programming or video editing.',
      'In the next step set the budget. It is shared out by purpose: gaming puts more into the graphics card, programming into the processor and memory.',
      'Pick a style, then try swapping each part in the Products step. The studio checks compatibility for you: the socket, the memory type and the power supply rating.',
      'When you are done, the summary page shows the price and specs of your build. Tell me “build a PC for 400,000 tenge” and I will suggest my own version.',
    ],
    lab: [
      'Welcome to the 3D lab! The hall has ten zones, each with real devices. First let us fly to the workstation: here are the computer, the monitor and the peripherals.',
      'Now to the assembly bench. Look, the processor is lit up, and the panel on the right says what it does. Turn the model with your mouse and look at it from every side.',
      'This is the network zone. I am showing you the router: it links the network of a home or school to the internet. The Test tab in the panel lets you check yourself.',
      'Finally, look at the showcase in the middle, with the most powerful devices. Click any device and ask me a question; the Overview button shows the whole hall.',
    ],
    games: [
      'Welcome to the games arena! There are six hands-on 3D games and five quick ones. The server checks every score, so the leaderboard is fair.',
      'In the 3D games you install the parts with your own hands: rebuild a phone, a laptop and a computer, plug in cables, build a network or find a fault. Pick a part in 3D or from the list under the scene.',
      'Watch the time bar: fast work without mistakes earns more points. Correct moves in a row give you a combo, and at the end you get one to three stars.',
      'After a game, press Play again to beat your record, or send the Challenge a friend link: your friend gets exactly the same job. Your records earn experience and levels.',
    ],
    live: [
      'Live games are played by the whole class together. The teacher opens a room and shows its code on the screen.',
      'Type the code under Join a game, or scan the QR code with your phone. Then wait for the teacher to start.',
      'In a quiz the question appears on the projector and you choose the answer on your phone: right and fast answers earn the most points. In races you build a computer or a network, and every mistake adds ten seconds.',
      'At the end the top three climb onto the podium. The teacher keeps the results and can go through them with the class later.',
    ],
    tasks: [
      'Let us open the tasks section. Here are the labs\' automatically checked tasks and the tasks your teacher set.',
      'Choose a task and its lab opens. At the top it says what to do and how it is marked.',
      'Do the task and press Check. The site checks your work against the rules, gives points and explains any mistakes.',
      'If you are not happy with the result, do it again: your best result is kept. You can take a hint, but it costs one point.',
    ],
    progress: [
      'My results is your achievement book. It shows your total points, average mark and how many labs you have completed.',
      'The table by lab shows how many tasks you have done in each one. Your activity over the last 14 days is on the chart.',
      'The achievements section holds the badges you have unlocked. Under each badge it says how to earn it.',
      'When you are signed in, your results are saved on the server and your teacher can see them. Finish every task and you can get a certificate.',
    ],
  },
  say: {
    greet: 'Hi! I am Bit, the {brand} assistant. Ask me about informatics, ask me to open a section, or let’s start a lesson together.',
    unknown: 'Sorry, I have no ready answer for that, and the AI is not connected right now. Pick one of the topics below or ask in a different way.',
    error: 'Sorry, I could not get an answer just now. Please try again in a moment.',
    navigate: 'Opening {name}.',
    lessonDone: 'Well done, the lesson is over! Now try the task on your own. Ask me if you have questions.',
    tourDone: 'That’s the tour. Good luck!',
    stopped: 'OK, I have stopped.',
    nothingToContinue: 'There is no lesson or tour to continue right now. Try “show me the site” or “start the logic lesson”.',
    buildWorking: 'Let me build a computer for {budget} tenge.',
    buildDone: 'Done! I built a {purpose} computer for {budget} tenge: a {cpu} processor and a {gpu} graphics card. The total is {total} tenge. I opened the build in Setup Studio, so you can swap any part.',
    buildNoGpu: 'Done! I built a {purpose} computer for {budget} tenge with a {cpu} processor; its built-in graphics drive the screen. The total is {total} tenge. I opened the build in Setup Studio.',
    buildGpuHint: 'A version with a graphics card costs about {total} tenge.',
    buildOver: 'A full build does not fit into that budget: the cheapest one costs {total} tenge. I opened it in Setup Studio, where you can change the budget.',
    buildFail: 'Sorry, I could not put a build together for that budget. Tell me the amount again, for example “build a PC for 400,000 tenge”.',
    purposes: {
      gaming: 'gaming',
      study: 'study',
      programming: 'programming',
      design3d: '3D design',
      streaming: 'streaming',
      universal: 'all-round',
    },
  },
  starters: ['help', 'cpu', 'binary', 'ip', 'password'],
};

export default en;
