-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Máy chủ: 127.0.0.1
-- Thời gian đã tạo: Th5 13, 2025 lúc 10:53 AM
-- Phiên bản máy phục vụ: 10.4.32-MariaDB
-- Phiên bản PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Cơ sở dữ liệu: `translate`
--

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `admin`
--

CREATE TABLE `admin` (
  `id` int(11) NOT NULL,
  `name` varchar(200) NOT NULL,
  `password` varchar(10) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `favorites`
--

CREATE TABLE `favorites` (
  `id` int(255) NOT NULL,
  `user_id` int(200) NOT NULL,
  `input_text` text NOT NULL,
  `translated_text` text NOT NULL,
  `source_lang` varchar(10) NOT NULL,
  `target_lang` varchar(10) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `translation_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `favorites`
--

INSERT INTO `favorites` (`id`, `user_id`, `input_text`, `translated_text`, `source_lang`, `target_lang`, `created_at`, `translation_id`) VALUES
(1, 3, 'hello', '喂', 'auto', 'zt', '2025-05-07 17:11:56', 1),
(5, 11, '我爱你', 'I love you', 'auto', 'en', '2025-05-09 08:24:11', 17);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `translations`
--

CREATE TABLE `translations` (
  `id` int(11) NOT NULL,
  `input_text` text NOT NULL,
  `source_lang` varchar(10) NOT NULL,
  `target_lang` varchar(10) NOT NULL,
  `translated_text` text NOT NULL,
  `user_id` int(200) DEFAULT NULL,
  `translated_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `translations`
--

INSERT INTO `translations` (`id`, `input_text`, `source_lang`, `target_lang`, `translated_text`, `user_id`, `translated_at`) VALUES
(1, 'hello', 'auto', 'zt', '喂', 3, '2025-05-07 17:11:38'),
(2, 'hello', 'auto', 'bg', 'ало', 3, '2025-05-08 17:31:24'),
(3, 'immediate', 'auto', 'zh', '即时', NULL, '2025-05-09 03:49:14'),
(4, 'immediate', 'auto', 'zh', '即时', NULL, '2025-05-09 03:49:14'),
(5, 'hello', 'auto', 'zh', '哈啰', NULL, '2025-05-09 03:51:39'),
(6, 'hello', 'auto', 'eu', 'kaixo', 3, '2025-05-09 03:56:30'),
(7, 'Hello', 'auto', 'en', 'Hello', 3, '2025-05-09 04:10:12'),
(8, 'Hello', 'auto', 'zh', '哈罗', 3, '2025-05-09 04:10:17'),
(9, 'hello', 'auto', 'en', 'hello', 11, '2025-05-09 06:24:54'),
(10, 'es quila\n', 'auto', 'en', 'es quila\n', 11, '2025-05-09 06:25:13'),
(11, 'es quila\n', 'auto', 'en', 'es quila\n', 11, '2025-05-09 06:25:13'),
(12, 'hello', 'en', 'ja', 'ログイン', 11, '2025-05-09 06:26:36'),
(13, 'hello', 'en', 'zh', '哈啰', 11, '2025-05-09 06:27:18'),
(14, 'hello', 'en', 'ar', 'مرحباً', 11, '2025-05-09 06:27:33'),
(15, '我是人类', 'auto', 'en', 'I\'m human', 11, '2025-05-09 06:28:48'),
(16, '来了', 'auto', 'en', 'Coming', 11, '2025-05-09 06:30:58'),
(17, '我爱你', 'auto', 'en', 'I love you', 11, '2025-05-09 06:31:26'),
(18, '你好', 'auto', 'en', 'Hello', 3, '2025-05-09 07:13:57'),
(19, '你好', 'auto', 'en', 'Hello', 11, '2025-05-09 08:24:53'),
(20, '我的', 'auto', 'en', 'Mine', 11, '2025-05-09 08:24:56'),
(21, 'hello', 'auto', 'eu', 'kaixo', 11, '2025-05-09 08:25:10'),
(22, '秦勇', 'auto', 'en', 'Qin Yong', 11, '2025-05-09 08:38:19'),
(23, '我爱你', 'auto', 'en', 'I love you', 11, '2025-05-09 08:38:32'),
(24, '加油', 'auto', 'en', 'Come on', 11, '2025-05-09 08:39:20'),
(25, '加油', 'auto', 'en', 'Come on', 11, '2025-05-09 08:39:28'),
(26, 'COME ON', 'auto', 'en', 'COME ON', 11, '2025-05-09 08:39:32'),
(27, '大楼', 'auto', 'en', 'Building', 11, '2025-05-09 08:39:38'),
(28, '加油', 'auto', 'en', 'Come on', 11, '2025-05-09 08:39:42'),
(29, '快点', 'auto', 'en', 'Come on', 11, '2025-05-09 08:41:12'),
(30, '惊雷', 'auto', 'en', 'Thunderbolt', 11, '2025-05-09 08:41:36'),
(31, '惊雷MV', 'auto', 'en', 'THUNDERFUL MV', 11, '2025-05-09 08:41:44'),
(32, '对不起', 'auto', 'en', 'Sorry', 11, '2025-05-09 08:42:22'),
(33, '对不起', 'auto', 'en', 'Sorry', 11, '2025-05-09 08:42:28'),
(34, '歇歇', 'auto', 'en', 'Rest', 11, '2025-05-09 08:42:54'),
(35, 'CC', 'auto', 'en', 'CC', 11, '2025-05-09 08:42:58'),
(36, '谢谢', 'auto', 'en', 'Thank you', 11, '2025-05-09 08:43:11'),
(37, '我爱你', 'auto', 'en', 'I love you', 11, '2025-05-09 08:43:24'),
(38, 'Hello', 'auto', 'zt', '喂', 3, '2025-05-11 16:15:58'),
(39, 'Hello', 'auto', 'ru', 'Привет', 3, '2025-05-11 16:24:12'),
(40, 'Hello', 'auto', 'en', 'Hello', 3, '2025-05-11 16:24:39');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `users`
--

CREATE TABLE `users` (
  `user_id` int(200) NOT NULL,
  `username` varchar(100) NOT NULL,
  `password` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `users`
--

INSERT INTO `users` (`user_id`, `username`, `password`, `email`) VALUES
(3, 'quangtran', '$2b$10$l3tGWd0CAj8Z0psr3iXsnu0CK8pyBqa2ftd6.DrBwWdjOC827D/pa', 'quang@vku.udn'),
(4, 'quang@', '$2b$10$ilXWLSRLQnaIpNG4E.2IWeSByfnuz1tIXMcdz5w8nHhKRCEpqB8.m', '123'),
(7, 'some-username', '$2b$10$d/GnMUmSwPU9.2KPG.mW9OKzA.2GUbDUBZp0nCBOqGte66Vbq8XQq', 'some-email'),
(8, 'sonlala', '$2b$10$Zp5jsHiIyF274viO6XoJNesyFBHXJDnR3ml3Sl8QTJkiRFUTIGPiC', 'son@gmail.com'),
(11, 'son', '$2b$10$.VT3anmDYMGsgNbfAqP.NuTpOQ9RBKV0/faztFvGH25ou9BUrVw.y', 'tsukikudo8@gmail.com');

--
-- Chỉ mục cho các bảng đã đổ
--

--
-- Chỉ mục cho bảng `admin`
--
ALTER TABLE `admin`
  ADD PRIMARY KEY (`id`);

--
-- Chỉ mục cho bảng `favorites`
--
ALTER TABLE `favorites`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_favorite` (`input_text`,`translated_text`,`source_lang`,`target_lang`) USING HASH,
  ADD KEY `user_id` (`user_id`),
  ADD KEY `fk_translation` (`translation_id`);

--
-- Chỉ mục cho bảng `translations`
--
ALTER TABLE `translations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Chỉ mục cho bảng `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`);

--
-- AUTO_INCREMENT cho các bảng đã đổ
--

--
-- AUTO_INCREMENT cho bảng `admin`
--
ALTER TABLE `admin`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `favorites`
--
ALTER TABLE `favorites`
  MODIFY `id` int(255) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT cho bảng `translations`
--
ALTER TABLE `translations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=41;

--
-- AUTO_INCREMENT cho bảng `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(200) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- Các ràng buộc cho các bảng đã đổ
--

--
-- Các ràng buộc cho bảng `favorites`
--
ALTER TABLE `favorites`
  ADD CONSTRAINT `favorites_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_translation` FOREIGN KEY (`translation_id`) REFERENCES `translations` (`id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `translations`
--
ALTER TABLE `translations`
  ADD CONSTRAINT `translations_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
