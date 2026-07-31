/* =============================================================================
   Column — Global language support
   English (default) · العربية · Français · 简体中文

   Drop-in: add <script src="i18n.js"></script> before </body> on any page.
   No markup changes needed — it matches rendered text and swaps it.

   - Language switcher is injected into .nav-actions automatically.
   - Choice persists in localStorage.
   - Arabic flips the page to RTL and loads an Arabic webfont.
   - Chinese loads a CJK webfont (DM Sans / Inter have no CJK glyphs).
   - A MutationObserver re-translates content rendered later by JS
     (configs, orders, wallet balances, etc).
   ============================================================================= */
(function () {
  'use strict';

  var STORE_KEY = 'column_lang';

  var LANGS = {
    en: { name: 'English',  flag: '🇬🇧', dir: 'ltr', font: null },
    ar: { name: 'العربية',  flag: '🇸🇦', dir: 'rtl', font: 'https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@300;400;500;600;700&display=swap' },
    fr: { name: 'Français', flag: '🇫🇷', dir: 'ltr', font: null },
    zh: { name: '简体中文',  flag: '🇨🇳', dir: 'ltr', font: 'https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;700&display=swap' }
  };

  /* ---------------------------------------------------------------------------
     Dictionary — keyed by the exact rendered English text.
     HTML entities in source (&copy; &#8212; &amp;) are already decoded by the
     browser, so keys use the decoded characters.
     --------------------------------------------------------------------------- */
  var T = {

    /* ===== Navigation & shared chrome ===== */
    'Home':                 { ar: 'الرئيسية',        fr: 'Accueil',        zh: '首页' },
    'Features':             { ar: 'المميزات',         fr: 'Fonctionnalités', zh: '功能' },
    'Pricing':              { ar: 'الأسعار',          fr: 'Tarifs',         zh: '价格' },
    'FAQ':                  { ar: 'الأسئلة الشائعة',  fr: 'FAQ',            zh: '常见问题' },
    'Status':               { ar: 'الحالة',           fr: 'Statut',         zh: '状态' },
    'News':                 { ar: 'الأخبار',          fr: 'Actualités',     zh: '公告' },
    'News & Updates':       { ar: 'الأخبار والتحديثات', fr: 'Actualités et mises à jour', zh: '公告与更新' },
    'What we are building right now.': { ar: 'ما نعمل عليه حالياً.', fr: 'Ce que nous développons en ce moment.', zh: '我们正在开发的内容。' },
    'Coming Soon':          { ar: 'قريباً',           fr: 'Bientôt',        zh: '即将推出' },
    'In Development':       { ar: 'قيد التطوير',      fr: 'En développement', zh: '开发中' },
    'Backtrack is close to release': { ar: 'خاصية Backtrack قريبة من الإصدار', fr: 'Backtrack est proche de la sortie', zh: 'Backtrack 即将发布' },
    'Backtrack is nearly ready. We are running the last round of checks to make sure it is stable and safe across all systems before we ship it.': {
      ar: 'خاصية Backtrack شبه جاهزة. نقوم حالياً بآخر جولة من الفحوصات للتأكد من استقرارها وأمانها على جميع الأنظمة قبل إطلاقها.',
      fr: 'Backtrack est presque prêt. Nous effectuons les derniers contrôles pour garantir sa stabilité et sa sécurité sur tous les systèmes avant sa sortie.',
      zh: 'Backtrack 已接近完成。发布前我们正在进行最后一轮检查，以确保它在所有系统上都稳定且安全。' },
    'We would rather hold it a few more days than push something that behaves differently on someone else\'s setup. Please be patient — it is coming.': {
      ar: 'نفضّل تأجيلها بضعة أيام إضافية على إطلاق شيء يتصرف بشكل مختلف على جهاز شخص آخر. نرجو الصبر — إنها قادمة.',
      fr: 'Nous préférons attendre quelques jours de plus plutôt que de sortir quelque chose qui se comporte différemment sur une autre configuration. Un peu de patience — ça arrive.',
      zh: '与其发布一个在别人电脑上表现不同的版本，我们宁愿再多等几天。请耐心等待——它就要来了。' },
    'Reworking all ability features': { ar: 'إعادة تطوير جميع خصائص القدرات', fr: 'Refonte de toutes les fonctions de capacités', zh: '全面重做技能功能' },
    'This is a broad pass rather than a single hero fix, so expect ability behaviour to get noticeably sharper over the next updates.': {
      ar: 'هذا تحسين شامل وليس إصلاحاً لبطل واحد، لذا توقّع أن يصبح أداء القدرات أدق بشكل ملحوظ في التحديثات القادمة.',
      fr: 'Il s\'agit d\'une passe globale et non du correctif d\'un seul héros : le comportement des capacités deviendra nettement plus précis au fil des prochaines mises à jour.',
      zh: '这是一次全面优化，而非针对单个英雄的修复，因此在接下来的更新中技能表现会明显更加精准。' },
    'Portal':               { ar: 'البوابة',          fr: 'Portail',        zh: '用户中心' },
    'Get Started':          { ar: 'ابدأ الآن',        fr: 'Commencer',      zh: '立即开始' },
    'Configs':              { ar: 'الإعدادات',        fr: 'Configs',        zh: '配置' },
    'Purchase':             { ar: 'الشراء',           fr: 'Acheter',        zh: '购买' },
    'Store':                { ar: 'المتجر',           fr: 'Boutique',       zh: '商店' },
    'Wallet':               { ar: 'المحفظة',          fr: 'Portefeuille',   zh: '钱包' },
    'Discord':              { ar: 'ديسكورد',          fr: 'Discord',        zh: 'Discord' },
    'Community':            { ar: 'المجتمع',          fr: 'Communauté',     zh: '社区' },
    'Legal':                { ar: 'قانوني',           fr: 'Mentions légales', zh: '法律条款' },
    'Quick Links':          { ar: 'روابط سريعة',      fr: 'Liens rapides',  zh: '快速链接' },
    'Contact:':             { ar: 'للتواصل:',         fr: 'Contact :',      zh: '联系方式：' },
    'Founder/Dev':          { ar: 'المؤسس / المطوّر', fr: 'Fondateur / Dév.', zh: '创始人 / 开发者' },
    'Owner':                { ar: 'المالك',           fr: 'Propriétaire',   zh: '所有者' },
    'Terms of Service':     { ar: 'شروط الخدمة',      fr: 'Conditions d\'utilisation', zh: '服务条款' },
    'Privacy Policy':       { ar: 'سياسة الخصوصية',   fr: 'Politique de confidentialité', zh: '隐私政策' },
    'Refund Policy':        { ar: 'سياسة الاسترجاع',  fr: 'Politique de remboursement', zh: '退款政策' },
    'The elite standard in private software.': { ar: 'المعيار الأول في البرامج الخاصة.', fr: 'La référence en logiciels privés.', zh: '私有软件的精英标准。' },
    '© 2026 Column. All rights reserved.': { ar: '© 2026 Column. جميع الحقوق محفوظة.', fr: '© 2026 Column. Tous droits réservés.', zh: '© 2026 Column. 保留所有权利。' },

    /* ===== Preloader ===== */
    'Column Security':      { ar: 'حماية Column',     fr: 'Sécurité Column', zh: 'Column 安全验证' },
    'Verifying secure connection to host...': { ar: 'جارٍ التحقق من الاتصال الآمن بالخادم...', fr: 'Vérification de la connexion sécurisée...', zh: '正在验证与主机的安全连接…' },

    /* ===== Cart ===== */
    'Your Cart':            { ar: 'سلة المشتريات',    fr: 'Votre panier',   zh: '购物车' },
    'Your cart is empty':   { ar: 'سلة المشتريات فارغة', fr: 'Votre panier est vide', zh: '购物车是空的' },
    'Total':                { ar: 'الإجمالي',         fr: 'Total',          zh: '总计' },
    'Checkout':             { ar: 'إتمام الشراء',     fr: 'Commander',      zh: '结算' },
    'Add to Cart':          { ar: 'أضف إلى السلة',    fr: 'Ajouter au panier', zh: '加入购物车' },

    /* ===== Hero / landing ===== */
    '20% OFF':              { ar: 'خصم 20%',          fr: '-20 %',          zh: '八折优惠' },
    'Launch discount active right now': { ar: 'خصم الإطلاق فعّال الآن', fr: 'Remise de lancement en cours', zh: '上线折扣进行中' },
    'SYSTEM ONLINE':        { ar: 'النظام يعمل',      fr: 'SYSTÈME EN LIGNE', zh: '系统在线' },
    'Experience':           { ar: 'اختبر',            fr: 'Découvrez la',   zh: '体验' },
    'Absolute Dominance':   { ar: 'السيطرة المطلقة',  fr: 'Domination absolue', zh: '绝对统治' },
    'The only semi-public provider that still hasn\'t taken a wave — while the rest go dark or leave their users banned and waiting. We stay up through every patch and every sweep.': {
      ar: 'المزوّد شبه العام الوحيد الذي لم تطله أي موجة حظر — بينما يختفي الآخرون أو يتركون مستخدميهم محظورين في الانتظار. نبقى متاحين بعد كل تحديث وكل حملة حظر.',
      fr: 'Le seul fournisseur semi-public à n\'avoir subi aucune vague de bans — pendant que les autres disparaissent ou laissent leurs utilisateurs bannis et sans réponse. Nous restons en ligne après chaque patch et chaque vague.',
      zh: '唯一一家至今未被封号潮波及的半公开提供商——其他家要么停服，要么让用户封号后无人过问。每一次补丁、每一轮封号潮之后，我们依旧在线。' },
    'No wave since launch': { ar: 'لا موجة حظر منذ الإطلاق', fr: 'Aucune vague depuis le lancement', zh: '上线至今零封号潮' },
    'Same-day patch updates': { ar: 'تحديث في نفس يوم الباتش', fr: 'Mises à jour le jour du patch', zh: '补丁当天即更新' },
    'Kernel-level protection': { ar: 'حماية على مستوى النواة', fr: 'Protection au niveau noyau', zh: '内核级防护' },
    'View Plans':           { ar: 'عرض الباقات',      fr: 'Voir les offres', zh: '查看套餐' },
    'Discover Features':    { ar: 'استكشف المميزات',  fr: 'Découvrir les fonctionnalités', zh: '了解功能' },
    'users online right now': { ar: 'مستخدم متصل الآن', fr: 'utilisateurs en ligne actuellement', zh: '位用户正在线' },
    'See It In':            { ar: 'شاهده أثناء',      fr: 'Voyez-le en',    zh: '实机' },
    'Action':               { ar: 'العمل',            fr: 'action',         zh: '演示' },
    'Real gameplay. No staging.': { ar: 'لقطات حقيقية من اللعب. بدون تمثيل.', fr: 'Vrai gameplay. Aucune mise en scène.', zh: '真实游戏画面，绝无摆拍。' },

    /* ===== Features ===== */
    'Unrivaled':            { ar: 'تقنية',            fr: 'Technologie',    zh: '无与伦比的' },
    'Technology':           { ar: 'لا تُضاهى',        fr: 'inégalée',       zh: '技术' },
    'We don\'t just follow the standards, we set them.': { ar: 'نحن لا نتبع المعايير، بل نضعها.', fr: 'Nous ne suivons pas les standards, nous les définissons.', zh: '我们不追随标准，我们制定标准。' },
    'Undetected & Secure':  { ar: 'غير مكشوف وآمن',   fr: 'Indétecté et sécurisé', zh: '未被检测且安全' },
    'Our custom Kernel Driver ensures your account remains fully protected from Warden and Defense Matrix.': {
      ar: 'تعريف النواة الخاص بنا يضمن بقاء حسابك محمياً بالكامل من أنظمة Warden و Defense Matrix.',
      fr: 'Notre pilote noyau sur mesure garantit que votre compte reste totalement protégé de Warden et Defense Matrix.',
      zh: '我们定制的内核驱动确保您的账号完全免受 Warden 与 Defense Matrix 的检测。' },
    'Instant Delivery':     { ar: 'تسليم فوري',       fr: 'Livraison instantanée', zh: '即时发货' },
    'Automated system delivers your key and loader instantly after successful payment verification.': {
      ar: 'نظام آلي يسلّمك المفتاح واللودر فوراً بعد تأكيد عملية الدفع.',
      fr: 'Un système automatisé vous livre votre clé et le loader immédiatement après validation du paiement.',
      zh: '付款验证通过后，自动系统立即发送您的密钥与加载器。' },
    'Streamlined Setup':    { ar: 'تثبيت مبسّط',      fr: 'Installation simplifiée', zh: '安装简便' },
    'Our intuitive custom loader and 1-click config system makes the entire setup incredibly effortless.': {
      ar: 'اللودر المخصص وسهل الاستخدام مع نظام الإعدادات بضغطة واحدة يجعل التثبيت في غاية البساطة.',
      fr: 'Notre loader intuitif et son système de config en un clic rendent l\'installation extrêmement simple.',
      zh: '直观的定制加载器与一键配置系统，让整个安装过程轻而易举。' },
    '24/7 VIP Support':     { ar: 'دعم VIP على مدار الساعة', fr: 'Support VIP 24/7', zh: '全天候 VIP 支持' },
    'Our expert support team is always available via Discord or Live Chat to assist you with any needs.': {
      ar: 'فريق الدعم المتخصص متاح دائماً عبر ديسكورد أو الدردشة المباشرة لمساعدتك في أي وقت.',
      fr: 'Notre équipe d\'experts est toujours disponible via Discord ou le chat en direct pour vous aider.',
      zh: '我们的专业支持团队随时通过 Discord 或在线聊天为您提供帮助。' },

    /* ===== Pricing ===== */
    'Select Your':          { ar: 'اختر',             fr: 'Choisissez votre', zh: '选择您的' },
    'Access':               { ar: 'اشتراكك',          fr: 'accès',          zh: '套餐' },
    'Premium features at highly competitive prices.': { ar: 'مميزات احترافية بأسعار تنافسية جداً.', fr: 'Des fonctionnalités premium à des prix très compétitifs.', zh: '高端功能，极具竞争力的价格。' },
    'BEST FOR TESTING':     { ar: 'الأفضل للتجربة',   fr: 'IDÉAL POUR TESTER', zh: '适合试用' },
    'MOST POPULAR':         { ar: 'الأكثر طلباً',     fr: 'LE PLUS POPULAIRE', zh: '最受欢迎' },
    'Daily':                { ar: 'يومي',             fr: 'Journalier',     zh: '日卡' },
    'Perfect for testing.': { ar: 'مثالي للتجربة.',   fr: 'Parfait pour tester.', zh: '适合测试。' },
    '/day':                 { ar: '/يوم',             fr: '/jour',          zh: '/天' },
    '24 Hours Access':      { ar: 'وصول لمدة 24 ساعة', fr: 'Accès 24 heures', zh: '24 小时访问' },
    'Full Feature Access':  { ar: 'وصول لكل المميزات', fr: 'Accès à toutes les fonctionnalités', zh: '全功能访问' },
    'Standard Support (24h max)': { ar: 'دعم عادي (خلال 24 ساعة)', fr: 'Support standard (24 h max)', zh: '标准支持（最长 24 小时）' },
    'China not supported yet': { ar: 'الصين غير مدعومة حالياً', fr: 'Chine pas encore prise en charge', zh: '暂不支持中国大陆' },
    '3 Days':               { ar: '3 أيام',           fr: '3 jours',        zh: '3 天' },
    'Weekend warrior.':     { ar: 'لعطلة نهاية الأسبوع.', fr: 'Pour le week-end.', zh: '周末畅玩。' },
    '/3 days':              { ar: '/3 أيام',          fr: '/3 jours',       zh: '/3 天' },
    '3 Days Access':        { ar: 'وصول لمدة 3 أيام', fr: 'Accès 3 jours',  zh: '3 天访问' },
    'Weekly':               { ar: 'أسبوعي',           fr: 'Hebdomadaire',   zh: '周卡' },
    'Great balance.':       { ar: 'توازن ممتاز.',     fr: 'Le bon équilibre.', zh: '性价比均衡。' },
    '/week':                { ar: '/أسبوع',           fr: '/semaine',       zh: '/周' },
    '7 Days Access':        { ar: 'وصول لمدة 7 أيام', fr: 'Accès 7 jours',  zh: '7 天访问' },
    'Monthly':              { ar: 'شهري',             fr: 'Mensuel',        zh: '月卡' },
    'Maximum value.':       { ar: 'أفضل قيمة.',       fr: 'Valeur maximale.', zh: '超值之选。' },
    '/month':               { ar: '/شهر',             fr: '/mois',          zh: '/月' },
    '30 Days Access':       { ar: 'وصول لمدة 30 يوماً', fr: 'Accès 30 jours', zh: '30 天访问' },
    'Priority Support (max 2h)': { ar: 'دعم ذو أولوية (خلال ساعتين)', fr: 'Support prioritaire (2 h max)', zh: '优先支持（最长 2 小时）' },
    'Save 65% Over Daily':  { ar: 'وفّر 65% مقارنة بالباقة اليومية', fr: 'Économisez 65 % vs journalier', zh: '比日卡节省 65%' },

    /* ===== FAQ ===== */
    'Got':                  { ar: 'لديك',             fr: 'Des',            zh: '还有' },
    'Questions?':           { ar: 'أسئلة؟',           fr: 'questions ?',    zh: '疑问？' },
    'Everything you need to know.': { ar: 'كل ما تحتاج معرفته.', fr: 'Tout ce qu\'il faut savoir.', zh: '您需要知道的一切。' },
    'How quickly do I receive my key?': { ar: 'كم يستغرق وصول المفتاح؟', fr: 'Sous combien de temps vais-je recevoir ma clé ?', zh: '多久能收到我的密钥？' },
    'All purchases are currently handled through our Discord. Open a ticket and a staff member will take care of your order and hand over your key and loader access as fast as we can — usually within minutes.': {
      ar: 'جميع عمليات الشراء تتم حالياً عبر سيرفر الديسكورد. افتح تذكرة وسيتولى أحد الموظفين طلبك ويسلّمك المفتاح والوصول إلى اللودر بأسرع ما يمكن — عادةً خلال دقائق.',
      fr: 'Tous les achats passent actuellement par notre Discord. Ouvrez un ticket et un membre du staff traitera votre commande et vous remettra votre clé et l\'accès au loader aussi vite que possible — généralement en quelques minutes.',
      zh: '目前所有购买均通过我们的 Discord 处理。提交工单后，工作人员会处理您的订单，并尽快将密钥与加载器权限交付给您——通常在几分钟内完成。' },
    'Is it safe for my main account?': { ar: 'هل هو آمن على حسابي الأساسي؟', fr: 'Est-ce sûr pour mon compte principal ?', zh: '在我的主账号上使用安全吗？' },
    'We never suggest you cheat on your main account. Even though we try our absolute best to make our product safe, cheating always carries an inherent risk. Use at your own risk.': {
      ar: 'لا ننصح أبداً باستخدامه على حسابك الأساسي. ورغم بذلنا أقصى جهد لجعل المنتج آمناً، يبقى الغش محفوفاً بالمخاطر دائماً. الاستخدام على مسؤوليتك الخاصة.',
      fr: 'Nous déconseillons toujours de tricher sur votre compte principal. Même si nous faisons tout pour sécuriser notre produit, tricher comporte toujours un risque. Utilisation à vos propres risques.',
      zh: '我们从不建议在主账号上使用。尽管我们竭尽全力保证产品安全，作弊始终存在固有风险。使用风险自负。' },
    'Do you provide cleaner/woofer?': { ar: 'هل توفرون أداة تنظيف (cleaner/woofer)؟', fr: 'Fournissez-vous un cleaner/woofer ?', zh: '你们提供清理工具（cleaner/woofer）吗？' },
    'Yes, We provide both cleaner and woofer for all Customers.': { ar: 'نعم، نوفّر أداتي cleaner و woofer لجميع العملاء.', fr: 'Oui, nous fournissons cleaner et woofer à tous nos clients.', zh: '是的，我们为所有客户提供 cleaner 和 woofer。' },

    /* ===== Setup guide ===== */
    'Installation':         { ar: 'دليل',             fr: 'Guide',          zh: '安装' },
    'Guide':                { ar: 'التثبيت',          fr: 'd\'installation', zh: '指南' },
    'Follow these exact steps to ensure a safe and successful launch.': {
      ar: 'اتبع هذه الخطوات بالترتيب بالضبط لضمان تشغيل آمن وناجح.',
      fr: 'Suivez exactement ces étapes pour un lancement sûr et réussi.',
      zh: '请严格按照以下步骤操作，以确保安全成功地启动。' },
    'Disable Antivirus & Windows Defender': { ar: 'إيقاف مضاد الفيروسات و Windows Defender', fr: 'Désactiver l\'antivirus et Windows Defender', zh: '关闭杀毒软件与 Windows Defender' },
    'Because our software interacts directly with game memory and uses a custom kernel driver to stay undetected, Windows will falsely flag it as a virus. You must completely disable Windows Defender Real-Time Protection and any third-party antivirus (like McAfee or Norton) before downloading.': {
      ar: 'لأن برنامجنا يتعامل مباشرة مع ذاكرة اللعبة ويستخدم تعريف نواة خاصاً حتى يبقى غير مكشوف، سيعتبره ويندوز فيروساً بالخطأ. يجب إيقاف الحماية الفورية في Windows Defender وأي مضاد فيروسات خارجي (مثل McAfee أو Norton) إيقافاً كاملاً قبل التحميل.',
      fr: 'Parce que notre logiciel interagit directement avec la mémoire du jeu et utilise un pilote noyau personnalisé pour rester indétecté, Windows le signalera à tort comme un virus. Vous devez désactiver complètement la Protection en temps réel de Windows Defender et tout antivirus tiers (McAfee, Norton) avant le téléchargement.',
      zh: '由于我们的软件直接操作游戏内存，并使用自定义内核驱动以保持未被检测，Windows 会误报为病毒。下载前，您必须完全关闭 Windows Defender 实时保护以及任何第三方杀毒软件（如 McAfee 或 Norton）。' },
    'Important:':           { ar: 'مهم:',             fr: 'Important :',    zh: '重要：' },
    'If you skip this step, Windows will automatically delete the loader file the second you try to open it.': {
      ar: 'إذا تجاوزت هذه الخطوة، سيحذف ويندوز ملف اللودر تلقائياً في نفس اللحظة التي تحاول فتحه فيها.',
      fr: 'Si vous sautez cette étape, Windows supprimera automatiquement le fichier loader dès que vous tenterez de l\'ouvrir.',
      zh: '如果跳过此步骤，您一打开加载器文件，Windows 就会立即自动删除它。' },
    'Disable Core Isolation & Driver Blocklist': { ar: 'إيقاف Core Isolation وقائمة حظر التعريفات', fr: 'Désactiver l\'isolation du noyau et la liste de blocage des pilotes', zh: '关闭内核隔离与驱动阻止列表' },
    'Enable Exploit Protection': { ar: 'تفعيل Exploit Protection', fr: 'Activer la protection contre les exploits', zh: '启用 Exploit Protection' },
    'This step is required for all features to work correctly. Open': { ar: 'هذه الخطوة ضرورية حتى تعمل جميع الخصائص بشكل صحيح. افتح', fr: 'Cette étape est requise pour que toutes les fonctionnalités marchent. Ouvrez', zh: '此步骤是所有功能正常工作的必要条件。打开' },
    'If Exploit Protection is turned OFF, the cheat will inject but features like ESP, aimbot, and FOV will not work. This must be ON.': {
      ar: 'إذا كان Exploit Protection مغلقاً، سيتم حقن البرنامج لكن خصائص مثل ESP والتصويب التلقائي و FOV لن تعمل. يجب أن يكون مفعّلاً.',
      fr: 'Si la protection contre les exploits est désactivée, le cheat s\'injectera mais des fonctions comme l\'ESP, l\'aimbot et le FOV ne fonctionneront pas. Elle doit être activée.',
      zh: '如果 Exploit Protection 处于关闭状态，辅助可以注入，但 ESP、自瞄和 FOV 等功能将无法工作。此项必须开启。' },
    'Download & Extract Loader': { ar: 'تحميل واستخراج اللودر', fr: 'Télécharger et extraire le loader', zh: '下载并解压加载器' },
    'Login to the Client Portal using your License Key. Click the "Download Loader" button. Once downloaded, extract the ZIP file to your Desktop or a dedicated folder. Do not run the loader directly from inside the ZIP archive.': {
      ar: 'ادخل إلى بوابة العملاء باستخدام مفتاح الترخيص. اضغط زر "Download Loader". بعد التحميل، استخرج ملف ZIP إلى سطح المكتب أو مجلد مخصص. لا تُشغّل اللودر من داخل ملف ZIP مباشرة.',
      fr: 'Connectez-vous au portail client avec votre clé de licence. Cliquez sur « Download Loader ». Une fois téléchargé, extrayez le ZIP sur votre bureau ou dans un dossier dédié. Ne lancez pas le loader directement depuis l\'archive ZIP.',
      zh: '使用您的许可密钥登录用户中心，点击"Download Loader"按钮。下载完成后，将 ZIP 文件解压到桌面或专用文件夹。请勿直接从 ZIP 压缩包内运行加载器。' },
    'Run Loader & Play':    { ar: 'تشغيل اللودر واللعب', fr: 'Lancer le loader et jouer', zh: '运行加载器并开始游戏' },
    'Go to Portal':         { ar: 'اذهب إلى البوابة', fr: 'Aller au portail', zh: '前往用户中心' },
    'Stay smart, play subtle, and don’t rage — that’s how private cheats last.': {
      ar: 'كن ذكياً، والعب بهدوء، ولا تبالغ — هكذا تدوم البرامج الخاصة.',
      fr: 'Restez malin, jouez discrètement, ne ragez pas — c\'est ainsi que les cheats privés durent.',
      zh: '保持聪明、低调游玩、不要嚣张——这才是私有辅助长久的秘诀。' },
    'How Bans Usually Happen': { ar: 'كيف يحدث الحظر عادةً', fr: 'Comment surviennent les bans', zh: '封禁通常是如何发生的' },
    'Automated Detection':  { ar: 'الكشف التلقائي',   fr: 'Détection automatisée', zh: '自动检测' },
    'Player Reports':       { ar: 'بلاغات اللاعبين',  fr: 'Signalements des joueurs', zh: '玩家举报' },
    'Behavioral Flags':     { ar: 'العلامات السلوكية', fr: 'Signaux comportementaux', zh: '行为标记' },
    'Bans can be temporary suspensions or permanent. Once a hardware flag is added, creating new accounts on the same setup becomes risky.': {
      ar: 'قد يكون الحظر مؤقتاً أو دائماً. وبمجرد إضافة علامة على جهازك، يصبح إنشاء حسابات جديدة على نفس الجهاز أمراً خطراً.',
      fr: 'Les bans peuvent être temporaires ou permanents. Une fois un marquage matériel appliqué, créer de nouveaux comptes sur la même configuration devient risqué.',
      zh: '封禁可能是临时的，也可能是永久的。一旦被打上硬件标记，在同一台设备上创建新账号就会变得非常危险。' },
    'Mass ban waves':       { ar: 'موجات حظر جماعية', fr: 'Vagues de bans massifs', zh: '大规模封禁潮' },
    'No appeal process':    { ar: 'لا يوجد اعتراض',   fr: 'Aucune procédure d\'appel', zh: '无申诉渠道' },
    'Ruins your main':      { ar: 'يدمّر حسابك الأساسي', fr: 'Ruine votre compte principal', zh: '毁掉您的主账号' },
    'Why It’s Smarter to Use an Old Overwatch 1 Account': {
      ar: 'لماذا استخدام حساب Overwatch 1 قديم أذكى؟',
      fr: 'Pourquoi il est plus malin d\'utiliser un ancien compte Overwatch 1',
      zh: '为什么使用老的《守望先锋 1》账号更明智' },
    'Overwatch 1 Accounts': { ar: 'حسابات Overwatch 1', fr: 'Comptes Overwatch 1', zh: '《守望先锋 1》账号' },
    'Building Trust on OW2': { ar: 'بناء الثقة على OW2', fr: 'Bâtir la confiance sur OW2', zh: '在 OW2 上建立信任度' },
    'Our Recommendation for Column Users': { ar: 'توصيتنا لمستخدمي Column', fr: 'Notre recommandation pour les utilisateurs Column', zh: '给 Column 用户的建议' },
    'Use an aged Overwatch 1 account when possible, OR': { ar: 'استخدم حساب Overwatch 1 قديماً إن أمكن، أو', fr: 'Utilisez un ancien compte Overwatch 1 si possible, OU', zh: '尽可能使用老的《守望先锋 1》账号，或者' },
    'Warm up a fresh OW2 account with clean playtime first.': { ar: 'جهّز حساب OW2 جديداً بساعات لعب نظيفة أولاً.', fr: 'Préparez un nouveau compte OW2 avec du temps de jeu propre d\'abord.', zh: '先用干净的游戏时长养一个新的 OW2 账号。' },
    'Combined with our internal, this keeps attention extremely low.': { ar: 'مع برنامجنا الداخلي، هذا يبقي الانتباه إليك منخفضاً جداً.', fr: 'Combiné à notre internal, cela maintient l\'attention à un niveau très faible.', zh: '配合我们的内部辅助，可以将关注度降到极低。' },
    'If you have questions about safe usage or account setup, open a ticket in our Discord. Our team is here 24/7 for approved members.': {
      ar: 'إذا كان لديك أي سؤال حول الاستخدام الآمن أو تجهيز الحساب، افتح تذكرة في سيرفر الديسكورد. فريقنا متواجد على مدار الساعة للأعضاء المعتمدين.',
      fr: 'Pour toute question sur l\'usage sûr ou la configuration de compte, ouvrez un ticket sur notre Discord. Notre équipe est là 24/7 pour les membres approuvés.',
      zh: '如果您对安全使用或账号设置有疑问，请在我们的 Discord 提交工单。我们的团队全天候为已认证会员服务。' },
    '⚠ Backtrack Warning:': { ar: '⚠ تحذير بخصوص Backtrack:', fr: '⚠ Avertissement Backtrack :', zh: '⚠ Backtrack 警告：' },
    'We strongly recommend keeping Backtrack values': { ar: 'ننصح بشدة بإبقاء قيم Backtrack', fr: 'Nous recommandons fortement de garder des valeurs Backtrack', zh: '我们强烈建议将 Backtrack 数值保持在' },
    'low':                  { ar: 'منخفضة',           fr: 'basses',         zh: '较低水平' },

    /* ===== Login / portal ===== */
    'Enter your license key to access the loader.': { ar: 'أدخل مفتاح الترخيص للوصول إلى اللودر.', fr: 'Entrez votre clé de licence pour accéder au loader.', zh: '输入您的许可密钥以访问加载器。' },
    'Invalid key provided.': { ar: 'المفتاح المُدخل غير صحيح.', fr: 'Clé invalide.', zh: '密钥无效。' },
    'License Key':          { ar: 'مفتاح الترخيص',    fr: 'Clé de licence', zh: '许可密钥' },
    'Authenticate':         { ar: 'تسجيل الدخول',     fr: 'S\'authentifier', zh: '验证登录' },
    'Welcome to Column':    { ar: 'مرحباً بك في Column', fr: 'Bienvenue sur Column', zh: '欢迎来到 Column' },
    'Since it\'s your first time logging in, please choose a username.': { ar: 'بما أن هذه أول مرة تسجّل فيها الدخول، من فضلك اختر اسم مستخدم.', fr: 'C\'est votre première connexion, veuillez choisir un nom d\'utilisateur.', zh: '由于这是您首次登录，请选择一个用户名。' },
    'Username':             { ar: 'اسم المستخدم',     fr: 'Nom d\'utilisateur', zh: '用户名' },
    'Save Username':        { ar: 'حفظ اسم المستخدم', fr: 'Enregistrer',    zh: '保存用户名' },
    'Welcome Back':         { ar: 'أهلاً بعودتك',     fr: 'Bon retour',     zh: '欢迎回来' },
    'Your license is currently active.': { ar: 'اشتراكك فعّال حالياً.', fr: 'Votre licence est actuellement active.', zh: '您的许可当前处于激活状态。' },
    'Undetected':           { ar: 'غير مكشوف',        fr: 'Indétecté',      zh: '未被检测' },
    'Key':                  { ar: 'المفتاح',          fr: 'Clé',            zh: '密钥' },
    'Expires':              { ar: 'ينتهي في',         fr: 'Expire le',      zh: '到期时间' },
    '🟢 Online Now':        { ar: '🟢 متصل الآن',     fr: '🟢 En ligne',    zh: '🟢 当前在线' },
    'CC Balance':           { ar: 'رصيد CC',          fr: 'Solde CC',       zh: 'CC 余额' },
    'Download Loader':      { ar: 'تحميل اللودر',     fr: 'Télécharger le loader', zh: '下载加载器' },
    'View Setup Guide':     { ar: 'عرض دليل التثبيت', fr: 'Voir le guide d\'installation', zh: '查看安装指南' },
    'Browse Configs':       { ar: 'تصفّح الإعدادات',  fr: 'Parcourir les configs', zh: '浏览配置' },
    'CC Wallet':            { ar: 'محفظة CC',         fr: 'Portefeuille CC', zh: 'CC 钱包' },
    'Config Store':         { ar: 'متجر الإعدادات',   fr: 'Boutique de configs', zh: '配置商店' },
    'Reset HWID':           { ar: 'إعادة تعيين HWID', fr: 'Réinitialiser le HWID', zh: '重置 HWID' },
    'Logout':               { ar: 'تسجيل الخروج',     fr: 'Déconnexion',    zh: '退出登录' },
    'Orders':               { ar: 'الطلبات',          fr: 'Commandes',      zh: '订单' },
    'Refresh':              { ar: 'تحديث',            fr: 'Actualiser',     zh: '刷新' },
    'Loading orders...':    { ar: 'جارٍ تحميل الطلبات...', fr: 'Chargement des commandes…', zh: '正在加载订单…' },

    /* ===== CC store ===== */
    'CC Store':             { ar: 'متجر CC',          fr: 'Boutique CC',    zh: 'CC 商店' },
    'Loading rewards...':   { ar: 'جارٍ تحميل المكافآت...', fr: 'Chargement des récompenses…', zh: '正在加载奖励…' },
    'Spend your Column Coins on exclusive rewards. Items are rare — save up.': {
      ar: 'أنفق عملات Column على مكافآت حصرية. العناصر نادرة — ادّخر رصيدك.',
      fr: 'Dépensez vos Column Coins pour des récompenses exclusives. Les articles sont rares — économisez.',
      zh: '使用您的 Column Coins 兑换独家奖励。物品稀有，请攒着用。' },
    'Login Required':       { ar: 'تسجيل الدخول مطلوب', fr: 'Connexion requise', zh: '需要登录' },
    'You need an active license to access the CC Store.': { ar: 'تحتاج اشتراكاً فعّالاً للوصول إلى متجر CC.', fr: 'Une licence active est requise pour accéder à la boutique CC.', zh: '您需要有效的许可才能访问 CC 商店。' },
    'Your balance:':        { ar: 'رصيدك:',           fr: 'Votre solde :',  zh: '您的余额：' },
    'Loading...':           { ar: 'جارٍ التحميل...',  fr: 'Chargement…',    zh: '加载中…' },
    '+ Earn CC':            { ar: '+ اكسب CC',        fr: '+ Gagner des CC', zh: '+ 赚取 CC' },
    'Owner Account':        { ar: 'حساب المالك',      fr: 'Compte propriétaire', zh: '所有者账号' },
    'You have full access to all rewards. Purchases are free for you.': { ar: 'لديك وصول كامل لجميع المكافآت. المشتريات مجانية بالنسبة لك.', fr: 'Vous avez accès à toutes les récompenses. Les achats sont gratuits pour vous.', zh: '您拥有全部奖励的完整权限，购买对您免费。' },
    '🔑 Subscriptions':     { ar: '🔑 الاشتراكات',    fr: '🔑 Abonnements', zh: '🔑 订阅' },
    '⚡ Account Perks':      { ar: '⚡ مزايا الحساب',  fr: '⚡ Avantages de compte', zh: '⚡ 账号特权' },
    '👑 Exclusive':         { ar: '👑 حصري',          fr: '👑 Exclusif',    zh: '👑 独家' },
    'Confirm Purchase':     { ar: 'تأكيد الشراء',     fr: 'Confirmer l\'achat', zh: '确认购买' },
    'Confirm':              { ar: 'تأكيد',            fr: 'Confirmer',      zh: '确认' },
    'Cancel':               { ar: 'إلغاء',            fr: 'Annuler',        zh: '取消' },

    /* ===== Configs ===== */
    'Config':               { ar: 'متصفّح',           fr: 'Navigateur de',  zh: '配置' },
    'Browser':              { ar: 'الإعدادات',        fr: 'configs',        zh: '浏览器' },
    'Browse community configs. Copy the code and paste it in-game to load instantly.': {
      ar: 'تصفّح إعدادات المجتمع. انسخ الكود والصقه داخل اللعبة لتحميله فوراً.',
      fr: 'Parcourez les configs de la communauté. Copiez le code et collez-le en jeu pour un chargement instantané.',
      zh: '浏览社区配置。复制代码并在游戏内粘贴即可立即加载。' },
    'You need an active license to browse configs.': { ar: 'تحتاج اشتراكاً فعّالاً لتصفّح الإعدادات.', fr: 'Une licence active est requise pour parcourir les configs.', zh: '您需要有效的许可才能浏览配置。' },
    'Claim & Upload Your Config': { ar: 'ارفع إعداداتك الخاصة', fr: 'Revendiquer et téléverser votre config', zh: '认领并上传您的配置' },
    'Show Upload Form':     { ar: 'إظهار نموذج الرفع', fr: 'Afficher le formulaire', zh: '显示上传表单' },
    'Config Code (from in-game share)': { ar: 'كود الإعدادات (من مشاركة اللعبة)', fr: 'Code de config (partage en jeu)', zh: '配置代码（来自游戏内分享）' },
    'Description':          { ar: 'الوصف',            fr: 'Description',    zh: '描述' },
    'Hero Name':            { ar: 'اسم البطل',        fr: 'Nom du héros',   zh: '英雄名称' },
    'Price (CC)':           { ar: 'السعر (CC)',       fr: 'Prix (CC)',      zh: '价格（CC）' },
    '0 = free for everyone': { ar: '0 = مجاني للجميع', fr: '0 = gratuit pour tous', zh: '0 = 对所有人免费' },
    'Publish Config':       { ar: 'نشر الإعدادات',    fr: 'Publier la config', zh: '发布配置' },
    'Loading configs...':   { ar: 'جارٍ تحميل الإعدادات...', fr: 'Chargement des configs…', zh: '正在加载配置…' },

    /* ===== Status ===== */
    'Real-time network and security monitoring.': { ar: 'مراقبة الشبكة والأمان في الوقت الحقيقي.', fr: 'Surveillance réseau et sécurité en temps réel.', zh: '实时网络与安全监控。' },
    'UNDETECTED':           { ar: 'غير مكشوف',        fr: 'INDÉTECTÉ',      zh: '未被检测' },
    'Users Online':         { ar: 'المستخدمون المتصلون', fr: 'Utilisateurs en ligne', zh: '在线用户' },
    'Uptime':               { ar: 'مدة التشغيل',      fr: 'Disponibilité',  zh: '正常运行时间' },
    'Reported Bans':        { ar: 'حالات حظر مُبلّغ عنها', fr: 'Bans signalés', zh: '已报告封禁' },
    'Update History':       { ar: 'سجل التحديثات',    fr: 'Historique des mises à jour', zh: '更新记录' },
    'Downtime while offsets are rebuilt': { ar: 'فترات التوقف أثناء إعادة بناء الأوفستات', fr: 'Indisponibilité pendant la reconstruction des offsets', zh: '重建偏移期间的停机时间' },
    'No downtime recorded yet.': { ar: 'لا توجد فترات توقف مسجّلة بعد.', fr: 'Aucune indisponibilité enregistrée.', zh: '暂无停机记录。' },
    'No outages on record': { ar: 'لا توجد أعطال مسجّلة', fr: 'Aucune panne enregistrée', zh: '无故障记录' },
    'History unavailable right now.': { ar: 'السجل غير متاح حالياً.', fr: 'Historique indisponible pour le moment.', zh: '记录暂时无法加载。' },
    'Last checked:':        { ar: 'آخر فحص:',         fr: 'Dernière vérification :', zh: '最后检查：' },
    'Just now':             { ar: 'الآن',             fr: 'À l\'instant',   zh: '刚刚' },

    /* ===== Terms of service ===== */
    'Terms of':             { ar: 'شروط',             fr: 'Conditions',     zh: '服务' },
    'Service':              { ar: 'الخدمة',           fr: 'd\'utilisation', zh: '条款' },
    'ALL SALES ARE FINAL.': { ar: 'جميع المبيعات نهائية.', fr: 'TOUTES LES VENTES SONT DÉFINITIVES.', zh: '所有销售均为最终交易，概不退换。' },

    /* ===== Wallet ===== */
    'Column Wallet':        { ar: 'محفظة Column',     fr: 'Portefeuille Column', zh: 'Column 钱包' },
    'Loading your CC balance...': { ar: 'جارٍ تحميل رصيد CC...', fr: 'Chargement de votre solde CC…', zh: '正在加载您的 CC 余额…' },
    'Manage your Column Coins — buy, send, and track transactions.': {
      ar: 'أدر عملات Column — اشترِ، أرسل، وتابع معاملاتك.',
      fr: 'Gérez vos Column Coins — achetez, envoyez et suivez vos transactions.',
      zh: '管理您的 Column Coins——购买、转账并追踪交易记录。' },
    'You need an active license to use the CC Wallet.': { ar: 'تحتاج اشتراكاً فعّالاً لاستخدام محفظة CC.', fr: 'Une licence active est requise pour utiliser le portefeuille CC.', zh: '您需要有效的许可才能使用 CC 钱包。' },
    'Column Coins Balance': { ar: 'رصيد Column Coins', fr: 'Solde Column Coins', zh: 'Column Coins 余额' },
    'Buy Column Coins':     { ar: 'شراء Column Coins', fr: 'Acheter des Column Coins', zh: '购买 Column Coins' },
    'Starter pack':         { ar: 'باقة البداية',     fr: 'Pack débutant',  zh: '入门包' },
    'Best value':           { ar: 'أفضل قيمة',        fr: 'Meilleur rapport', zh: '超值之选' },
    'Power user':           { ar: 'للمستخدم المكثّف', fr: 'Utilisateur intensif', zh: '重度用户' },
    'Select':               { ar: 'اختر',             fr: 'Choisir',        zh: '选择' },
    'Send CC':              { ar: 'إرسال CC',         fr: 'Envoyer des CC', zh: '转账 CC' },
    'Recipient Username':   { ar: 'اسم المستلم',      fr: 'Nom du destinataire', zh: '收款人用户名' },
    'Amount (CC)':          { ar: 'المبلغ (CC)',      fr: 'Montant (CC)',   zh: '金额（CC）' },
    'Transaction History':  { ar: 'سجل المعاملات',    fr: 'Historique des transactions', zh: '交易记录' },
    'Loading transactions...': { ar: 'جارٍ تحميل المعاملات...', fr: 'Chargement des transactions…', zh: '正在加载交易记录…' },
    'Free CC Challenges':   { ar: 'تحديات CC المجانية', fr: 'Défis CC gratuits', zh: '免费 CC 任务' },
    'Share a Config':       { ar: 'شارك إعداداتك',    fr: 'Partager une config', zh: '分享配置' },
    'Upload a config to the community via the Configs page': { ar: 'ارفع إعداداتك للمجتمع من صفحة الإعدادات', fr: 'Téléversez une config via la page Configs', zh: '通过配置页面上传配置到社区' },
    'Claim':                { ar: 'استلام',           fr: 'Réclamer',       zh: '领取' },
    'Daily Login':          { ar: 'تسجيل دخول يومي',  fr: 'Connexion quotidienne', zh: '每日登录' },
    'Log in once per day to earn CC': { ar: 'سجّل دخولك مرة يومياً لتكسب CC', fr: 'Connectez-vous une fois par jour pour gagner des CC', zh: '每天登录一次即可赚取 CC' },
    'Refer a Friend':       { ar: 'ادعُ صديقاً',      fr: 'Parrainer un ami', zh: '邀请好友' },
    'Get a friend to join Column — open a Discord ticket to claim': { ar: 'اجعل صديقاً ينضم إلى Column — افتح تذكرة في ديسكورد للاستلام', fr: 'Faites venir un ami sur Column — ouvrez un ticket Discord pour réclamer', zh: '邀请好友加入 Column——提交 Discord 工单领取' },
    'Discord Ticket':       { ar: 'تذكرة ديسكورد',    fr: 'Ticket Discord', zh: 'Discord 工单' },
    'Become a CC Reseller': { ar: 'كن موزّعاً لـ CC',  fr: 'Devenir revendeur CC', zh: '成为 CC 分销商' },
    'Sell Column Coins and earn commissions. Apply via our Discord server.': { ar: 'بِع عملات Column واكسب عمولات. قدّم طلبك عبر سيرفر ديسكورد.', fr: 'Vendez des Column Coins et gagnez des commissions. Postulez via notre serveur Discord.', zh: '销售 Column Coins 并赚取佣金。请通过我们的 Discord 服务器申请。' },
    'Apply on Discord':     { ar: 'قدّم عبر ديسكورد', fr: 'Postuler sur Discord', zh: '在 Discord 申请' },
    'To purchase CC, open a ticket in our Discord server and mention:': { ar: 'لشراء CC، افتح تذكرة في سيرفر ديسكورد واذكر:', fr: 'Pour acheter des CC, ouvrez un ticket sur notre Discord et mentionnez :', zh: '如需购买 CC，请在我们的 Discord 服务器提交工单并注明：' },
    'A staff member will add the CC to your account after payment confirmation.': { ar: 'سيقوم أحد الموظفين بإضافة CC إلى حسابك بعد تأكيد الدفع.', fr: 'Un membre du staff créditera votre compte après confirmation du paiement.', zh: '付款确认后，工作人员会将 CC 添加到您的账号。' },
    'Open Discord Ticket':  { ar: 'افتح تذكرة ديسكورد', fr: 'Ouvrir un ticket Discord', zh: '提交 Discord 工单' }
  };

  /* --------------------------------------------------------------------------- */

  function norm(s) { return s.replace(/\s+/g, ' ').trim(); }

  function currentLang() {
    try { return localStorage.getItem(STORE_KEY) || 'en'; } catch (e) { return 'en'; }
  }

  // Original English is stashed on first pass so switching back is lossless.
  var TEXT_KEY = '__col_en';
  // What WE last wrote into the node. If the node no longer holds that, the
  // page's own scripts changed it (live user count, order lists, balances) and
  // the stashed baseline is stale — without this the observer would keep
  // restoring the old placeholder and wipe every dynamic value on the page.
  var WROTE_KEY = '__col_wrote';

  function translateTextNodes(root, lang) {
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        var p = n.parentNode;
        if (!p) return NodeFilter.FILTER_REJECT;
        var tag = p.nodeName;
        if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'TEXTAREA') return NodeFilter.FILTER_REJECT;
        if (p.closest && p.closest('#column-lang')) return NodeFilter.FILTER_REJECT;
        return n.nodeValue && n.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    var n, batch = [];
    while ((n = walker.nextNode())) batch.push(n);

    batch.forEach(function (node) {
      // Re-baseline when the page rewrote this node itself, otherwise a live
      // value (users online, CC balance, order rows) gets reverted to the
      // placeholder that was there when we first saw it.
      if (node[TEXT_KEY] === undefined || node[WROTE_KEY] !== node.nodeValue) {
        node[TEXT_KEY] = node.nodeValue;
      }
      var en = norm(node[TEXT_KEY]);
      var out;
      if (lang === 'en') {
        out = node[TEXT_KEY];
      } else {
        var entry = T[en];
        if (entry && entry[lang]) {
          // preserve surrounding whitespace so inline layout doesn't collapse
          var lead = node[TEXT_KEY].match(/^\s*/)[0];
          var tail = node[TEXT_KEY].match(/\s*$/)[0];
          out = lead + entry[lang] + tail;
        } else {
          out = node[TEXT_KEY];
        }
      }
      node.nodeValue  = out;
      node[WROTE_KEY] = out;
    });
  }

  var ATTRS = ['placeholder', 'title', 'aria-label', 'value'];

  function translateAttributes(root, lang) {
    ATTRS.forEach(function (attr) {
      var sel = '[' + attr + ']';
      var els = root.querySelectorAll ? root.querySelectorAll(sel) : [];
      Array.prototype.forEach.call(els, function (el) {
        if (attr === 'value' && el.tagName === 'INPUT' &&
            !/^(button|submit|reset)$/i.test(el.type || '')) return;
        var stash = '__col_en_' + attr;
        if (el[stash] === undefined) el[stash] = el.getAttribute(attr);
        var en = norm(el[stash] || '');
        if (lang === 'en') { if (el[stash] != null) el.setAttribute(attr, el[stash]); return; }
        var entry = T[en];
        if (entry && entry[lang]) el.setAttribute(attr, entry[lang]);
        else if (el[stash] != null) el.setAttribute(attr, el[stash]);
      });
    });
  }

  function loadFont(url) {
    if (!url || document.querySelector('link[data-col-font="' + url + '"]')) return;
    var l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = url;
    l.setAttribute('data-col-font', url);
    document.head.appendChild(l);
  }

  function injectDirCss() {
    if (document.getElementById('column-i18n-css')) return;
    var s = document.createElement('style');
    s.id = 'column-i18n-css';
    s.textContent = [
      /* Arabic + CJK webfonts stack in front of the existing families */
      'html[lang="ar"] body, html[lang="ar"] button, html[lang="ar"] input, html[lang="ar"] textarea {',
      '  font-family: "Noto Sans Arabic", "DM Sans", "Inter", sans-serif;',
      '}',
      'html[lang="zh"] body, html[lang="zh"] button, html[lang="zh"] input, html[lang="zh"] textarea {',
      '  font-family: "Noto Sans SC", "DM Sans", "Inter", sans-serif;',
      '}',
      /* RTL: mirror text flow but keep flex rows and icons sane */
      'html[dir="rtl"] body { direction: rtl; text-align: right; }',
      'html[dir="rtl"] .nav-container, html[dir="rtl"] .nav-links,',
      'html[dir="rtl"] .nav-actions, html[dir="rtl"] .logo-wrapper { direction: rtl; }',
      'html[dir="rtl"] .footer-grid, html[dir="rtl"] .pricing-grid,',
      'html[dir="rtl"] .features-grid { direction: rtl; }',
      /* numbers, prices, keys and code stay LTR inside RTL text */
      'html[dir="rtl"] .price, html[dir="rtl"] code, html[dir="rtl"] pre,',
      'html[dir="rtl"] input, html[dir="rtl"] .key-display, html[dir="rtl"] .mono {',
      '  direction: ltr; text-align: left; unicode-bidi: embed;',
      '}',
      'html[dir="rtl"] ul, html[dir="rtl"] ol { padding-right: 1.2rem; padding-left: 0; }',
      /* ---------------------------------------------------------------
         Nav overlap fix.
         .nav-links is absolutely centered (position:absolute + translate),
         so it is out of flow and cannot push .nav-actions — it just runs
         underneath it. In English the two clear each other by a few px;
         translated labels are longer ("Fonctionnalités", "الأسئلة الشائعة")
         and the cart button ends up on top of the last nav link.
         Only for non-English: put the links back in flow so flex can size
         them instead of letting them overlap. English is untouched.
         --------------------------------------------------------------- */
      'html:not([lang="en"]) .nav-container { gap: 1rem; }',
      'html:not([lang="en"]) .nav-links {',
      '  position: static; transform: none; left: auto; top: auto;',
      '  flex: 1 1 auto; min-width: 0; justify-content: center;',
      '  gap: 1.5rem;',
      '}',
      'html:not([lang="en"]) .nav-links a { font-size: 0.8rem; }',
      'html:not([lang="en"]) .nav-actions { flex: 0 0 auto; }',
      /* tablet range: links are still shown (they only hide at 768px) but
         space is tight once labels are translated — tighten before it bites */
      '@media (max-width: 1100px) {',
      '  html:not([lang="en"]) .nav-links { gap: 0.9rem; }',
      '  html:not([lang="en"]) .nav-links a { font-size: 0.74rem; }',
      '}',
      /* keep actions above the links no matter what */
      '.nav-actions { position: relative; z-index: 3; }',

      /* language switcher */
      '#column-lang { position: relative; display: inline-flex; }',
      '#column-lang > button {',
      '  display: inline-flex; align-items: center; gap: .45rem; cursor: pointer;',
      '  background: rgba(255,255,255,.06); color: #e6e9f5;',
      '  border: 1px solid rgba(255,255,255,.12); border-radius: 999px;',
      '  padding: .4rem .75rem; font: inherit; font-size: .85rem; line-height: 1;',
      '  transition: background .2s, border-color .2s;',
      '}',
      '#column-lang > button:hover { background: rgba(255,255,255,.12); border-color: rgba(124,58,237,.6); }',
      '#column-lang .col-lang-code { font-weight: 600; letter-spacing: .04em; }',
      '#column-lang .col-lang-menu {',
      '  position: absolute; top: calc(100% + .5rem); right: 0; min-width: 168px;',
      '  background: #0d0d18; border: 1px solid rgba(255,255,255,.12);',
      '  border-radius: 12px; padding: .35rem; z-index: 100000;',
      '  box-shadow: 0 18px 40px rgba(0,0,0,.55); display: none;',
      '}',
      'html[dir="rtl"] #column-lang .col-lang-menu { right: auto; left: 0; }',
      '#column-lang.open .col-lang-menu { display: block; }',
      '#column-lang .col-lang-menu button {',
      '  display: flex; align-items: center; gap: .6rem; width: 100%;',
      '  background: none; border: 0; color: #c9cee0; cursor: pointer;',
      '  padding: .55rem .7rem; border-radius: 8px; font: inherit; font-size: .88rem;',
      '  text-align: left;',
      '}',
      'html[dir="rtl"] #column-lang .col-lang-menu button { text-align: right; }',
      '#column-lang .col-lang-menu button:hover { background: rgba(124,58,237,.18); color: #fff; }',
      '#column-lang .col-lang-menu button[aria-current="true"] { color: #a78bfa; font-weight: 600; }',
      '@media (max-width: 820px) { #column-lang > button span.col-lang-code { display: none; } }'
    ].join('\n');
    document.head.appendChild(s);
  }

  function buildSwitcher() {
    if (document.getElementById('column-lang')) return;
    var host = document.querySelector('.nav-actions') || document.querySelector('.navbar .nav-container');
    if (!host) return;

    var wrap = document.createElement('div');
    wrap.id = 'column-lang';

    var cur = currentLang();
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Language');
    // Flag + 2-letter code only. The full name lives in the dropdown — the
    // trigger has to stay narrow or it pushes the nav into the centred links.
    btn.innerHTML = '<span class="col-lang-flag">' + LANGS[cur].flag + '</span>' +
                    '<span class="col-lang-code">' + cur.toUpperCase() + '</span>' +
                    '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="6 9 12 15 18 9"></polyline></svg>';

    var menu = document.createElement('div');
    menu.className = 'col-lang-menu';
    Object.keys(LANGS).forEach(function (code) {
      var item = document.createElement('button');
      item.type = 'button';
      item.dataset.lang = code;
      if (code === cur) item.setAttribute('aria-current', 'true');
      item.innerHTML = '<span>' + LANGS[code].flag + '</span><span>' + LANGS[code].name + '</span>';
      item.addEventListener('click', function (e) {
        e.stopPropagation();
        setLang(code);
        wrap.classList.remove('open');
      });
      menu.appendChild(item);
    });

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      wrap.classList.toggle('open');
    });
    document.addEventListener('click', function () { wrap.classList.remove('open'); });

    wrap.appendChild(btn);
    wrap.appendChild(menu);

    // sit before the mobile hamburger if present, else append
    var hamburger = host.querySelector('#mobile-menu-toggle');
    if (hamburger) host.insertBefore(wrap, hamburger);
    else host.appendChild(wrap);
  }

  function refreshSwitcherLabel(lang) {
    var wrap = document.getElementById('column-lang');
    if (!wrap) return;
    var f = wrap.querySelector('.col-lang-flag');
    var c = wrap.querySelector('.col-lang-code');
    if (f) f.textContent = LANGS[lang].flag;
    if (c) c.textContent = lang.toUpperCase();
    Array.prototype.forEach.call(wrap.querySelectorAll('.col-lang-menu button'), function (b) {
      if (b.dataset.lang === lang) b.setAttribute('aria-current', 'true');
      else b.removeAttribute('aria-current');
    });
  }

  var observer = null;
  var pending = null;

  function apply(lang) {
    var cfg = LANGS[lang] || LANGS.en;
    document.documentElement.lang = lang;
    document.documentElement.dir = cfg.dir;
    loadFont(cfg.font);

    if (observer) observer.disconnect();
    translateTextNodes(document.body, lang);
    translateAttributes(document.body, lang);
    refreshSwitcherLabel(lang);
    if (observer) observer.observe(document.body, { childList: true, subtree: true });
  }

  function setLang(lang) {
    if (!LANGS[lang]) lang = 'en';
    try { localStorage.setItem(STORE_KEY, lang); } catch (e) {}
    apply(lang);
  }

  function start() {
    injectDirCss();
    buildSwitcher();

    // Content rendered later by the site's own scripts gets translated too.
    observer = new MutationObserver(function () {
      if (pending) return;
      pending = setTimeout(function () {
        pending = null;
        var lang = currentLang();
        if (lang === 'en') return;
        observer.disconnect();
        translateTextNodes(document.body, lang);
        translateAttributes(document.body, lang);
        observer.observe(document.body, { childList: true, subtree: true });
      }, 60);
    });

    apply(currentLang());
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();

  window.ColumnI18n = { set: setLang, get: currentLang, dict: T, langs: LANGS };
})();
