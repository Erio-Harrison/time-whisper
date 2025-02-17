// src/utils/processName.ts

// 应用名称映射表
const APP_NAMES: Record<string, string> = {
  // 当前应用
  'time-whisper': 'Time Whisper',
  'time_whisper': 'Time Whisper',
  'timewhisper': 'Time Whisper',

  // Windows 应用
  'chrome': 'Google Chrome',
  'msedge': 'Microsoft Edge',
  'microsoftedge': 'Microsoft Edge',
  'code': 'VS Code',
  'notepad': '记事本',
  'notepad++': 'Notepad++',
  'explorer': '文件资源管理器',
  'powershell': 'PowerShell',
  'cmd': '命令提示符',
  'mstsc': '远程桌面连接',
  'taskmgr': '任务管理器',
  'calc': '计算器',
  'mspaint': '画图',
  'snippingtool': '截图工具',
  'control': '控制面板',
  'regedit': '注册表编辑器',

  // 社交通讯
  'steam': 'Steam',
  'wechat': '微信',
  'qq': 'QQ',
  'tim': 'TIM',
  'dingtalk': '钉钉',
  'feishu': '飞书',
  'lark': '飞书',
  'weixin': '微信',
  'discord': 'Discord',
  'slack': 'Slack',
  'telegram': 'Telegram',
  'skype': 'Skype',
  'whatsapp': 'WhatsApp',
  'zoom': 'Zoom',
  'teams': 'Microsoft Teams',
  'msteams': 'Microsoft Teams',

  // 开发工具
  'idea64': 'IntelliJ IDEA',
  'idea': 'IntelliJ IDEA',
  'pycharm64': 'PyCharm',
  'pycharm': 'PyCharm',
  'webstorm64': 'WebStorm',
  'webstorm': 'WebStorm',
  'goland64': 'GoLand',
  'goland': 'GoLand',
  'datagrip64': 'DataGrip',
  'datagrip': 'DataGrip',
  'rider64': 'Rider',
  'rider': 'Rider',
  'clion64': 'CLion',
  'clion': 'CLion',
  'vscode': 'VS Code',
  'sublime_text': 'Sublime Text',
  'eclipse': 'Eclipse',
  'android studio': 'Android Studio',
  'postman': 'Postman',
  'dbeaver': 'DBeaver',
  'git-bash': 'Git Bash',
  'sourcetree': 'Sourcetree',
  'github desktop': 'GitHub Desktop',
  'vim': 'Vim',
  'gvim': 'Vim',
  'nvim': 'Neovim',
  'emacs': 'Emacs',
  'xemacs': 'XEmacs',

  // 浏览器
  'firefox': 'Firefox',
  'brave': 'Brave',
  'opera': 'Opera',
  'chromium': 'Chromium',
  'vivaldi': 'Vivaldi',
  'tor browser': 'Tor Browser',
  'safari': 'Safari',
  'maxthon': '遨游浏览器',
  '360se': '360 安全浏览器',
  'qqbrowser': 'QQ浏览器',

  // 办公软件
  'winword': 'Microsoft Word',
  'word': 'Microsoft Word',
  'excel': 'Microsoft Excel',
  'powerpnt': 'Microsoft PowerPoint',
  'powerpoint': 'Microsoft PowerPoint',
  'outlook': 'Microsoft Outlook',
  'onenote': 'Microsoft OneNote',
  'access': 'Microsoft Access',
  'publisher': 'Microsoft Publisher',
  'visio': 'Microsoft Visio',
  'thunderbird': 'Thunderbird',
  'foxmail': 'Foxmail',
  'wps': 'WPS Office',
  'et': 'WPS 表格',
  'wpp': 'WPS 演示',
  'pdf': 'Adobe Acrobat',
  'acrobat': 'Adobe Acrobat',
  'acrord32': 'Adobe Reader',
  'foxit reader': 'Foxit Reader',
  'evernote': 'Evernote',
  'youdao': '有道云笔记',
  'typora': 'Typora',
  'obsidian': 'Obsidian',
  'notion': 'Notion',

  // 媒体工具
  'potplayer': 'PotPlayer',
  'vlc': 'VLC',
  'wmplayer': 'Windows Media Player',
  'spotify': 'Spotify',
  'cloudmusic': '网易云音乐',
  'qqmusic': 'QQ音乐',
  'foobar2000': 'foobar2000',
  'aimp': 'AIMP',
  'itunes': 'iTunes',
  'quicktime': 'QuickTime Player',
  'photoshop': 'Adobe Photoshop',
  'illustrator': 'Adobe Illustrator',
  'premiere': 'Adobe Premiere Pro',
  'aftereffects': 'Adobe After Effects',
  'gimp': 'GIMP',
  'krita': 'Krita',
  'blender': 'Blender',
  'obs': 'OBS Studio',
  'obs64': 'OBS Studio',

  // 实用工具
  '7zfm': '7-Zip',
  'winrar': 'WinRAR',
  'bandizip': 'Bandizip',
  'everything': 'Everything',
  'ccleaner': 'CCleaner',
  'teamviewer': 'TeamViewer',
  'anydesk': 'AnyDesk',
  'calibre': 'Calibre',
  'snagit': 'Snagit',
  'qbittorrent': 'qBittorrent',
  'uTorrent': 'µTorrent',
  'xunlei': '迅雷',
  'thunder': '迅雷',
  'idm': 'Internet Download Manager',
  'nox': '夜神模拟器',
  'virtualbox': 'VirtualBox',
  'vmware': 'VMware',

  // macOS 应用
  'finder': 'Finder',
  'preview': '预览',
  'terminal': '终端',
  'iterm2': 'iTerm',
  'activitymonitor': '活动监视器',
  'systempreferences': '系统设置',
  'textedit': '文本编辑',
  'pages': 'Pages',
  'numbers': 'Numbers',
  'keynote': 'Keynote',
  'xcode': 'Xcode',

  // Linux 应用
  'gnome-terminal': '终端',
  'konsole': 'Konsole',
  'nautilus': '文件',
  'dolphin': 'Dolphin',
  'gedit': '文本编辑器',
  'kate': 'Kate',
  'inkscape': 'Inkscape',
  'systemsettings': '系统设置',
  'kwrite': 'KWrite',
  'okular': 'Okular',
  'gwenview': 'Gwenview',
};
  
  export const formatProcessName = (processName: string): string => {
    // 清理进程名，移除常见的后缀和路径
    let name = processName.toLowerCase()
      .replace(/\.exe$/i, '') // Windows
      .replace(/\.app$/i, '') // macOS
      .replace(/^\/.*\//g, '') // Unix-like paths
      .split('/').pop() || '';
  
    // 尝试从映射中获取应用名
    if (APP_NAMES[name]) {
      return APP_NAMES[name];
    }
  
    // 对于 macOS 的 .app bundles，美化处理
    if (name.endsWith('.app')) {
      name = name.slice(0, -4);
    }
  
    // 对于未知应用，美化进程名
    return name
      .split(/[_\-\s]+/) // 按常见分隔符分割
      .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // 首字母大写
      .join(' '); // 用空格连接
  };