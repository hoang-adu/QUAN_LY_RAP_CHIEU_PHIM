-- =====================================================================
-- Cap nhat poster (anh dai dien) cho 23 phim co san trong bang movies
-- Chi chay 1 lan tren database DA CO SAN du lieu (khong dung de tao moi).
-- Khop theo cot title, khong anh huong cac cot khac.
-- =====================================================================

-- Tat Safe Update Mode tam thoi (chi trong phien nay) de UPDATE theo cot
-- title (khong phai khoa) khong bi MySQL Workbench chan (loi 1175).
SET SQL_SAFE_UPDATES = 0;

UPDATE movies SET poster = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRnjhb07sNvtZHH4ZA2V9Co6yDTjdCuX9JDgnOeJhKCdw&s=10' WHERE title = 'Avengers: Endgame';
UPDATE movies SET poster = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQIXJZ8WrjSPI56HohNHqaPZN4XLThwSLU0CVrCV2Beqw&s=10' WHERE title = 'Interstellar';
UPDATE movies SET poster = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRtz9RhLV9hfCbjQ1-2cZj0wttAea-T876qVKL4akIiZg&s=10' WHERE title = 'Spider-Man: No Way Home';
UPDATE movies SET poster = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRh6Aal13HUFHLMJYB0XMKVlj0P6ZKN6Zi4seKOfNy2sQ&s=10' WHERE title = 'Inception';
UPDATE movies SET poster = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSsqxaEWgE3vZ8enGmjvb_3v3AH8xEfxQhBHagOGuMRMg&s=10' WHERE title = 'The Dark Knight';
UPDATE movies SET poster = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSEWP0EtvEQQKA1CUplqT-LzNuKoTzSUssOxxu_7PMoNA&s=10' WHERE title = 'Parasite';
UPDATE movies SET poster = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQNi4aMVtjK9CiJu_N1DVwgLJpr3UfduxS8nEgBXe4mIQ&s=10' WHERE title = 'Frozen II';
UPDATE movies SET poster = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS53Q3I6YLmjwMEBmdGr4jdfHgwFRm6XBdM2GcITJrS5g&s=10' WHERE title = 'Joker';
UPDATE movies SET poster = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQb1FFpxmJuqfftXP9RqfyHb0elxKcx0Rn6hsVJS4fRcA&s=10' WHERE title = 'Dune';
UPDATE movies SET poster = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQOB_UB49-P1X1QXVnUvbNPVPHiyKCYqkutoxxGyH6Pug&s=10' WHERE title = 'La La Land';
UPDATE movies SET poster = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ1SoUy7ODhlOcHoHPvY443IF9gPxkNell0eomasu264w&s=10' WHERE title = 'Doraemon: Nobita và Mặt Trăng Kỳ Diệu';
UPDATE movies SET poster = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSa5S9Lf3B9p1dZCVkKOMtIZ2d3kcFaG0GMVosyVKa32w&s=10' WHERE title = 'Mai';
UPDATE movies SET poster = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQlsRw7w7IFGsrWEAmaQ6xqhM49HbvkXYf_wl_GzjT3Bw&s=10' WHERE title = 'Bố Già';
UPDATE movies SET poster = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTycl2lNQjQUns4JZMwDxSTBfmB3WV_Bqf7Lf0mYq2yzA&s=10' WHERE title = 'Đất Rừng Phương Nam';
UPDATE movies SET poster = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQg7wE7UUUKORVkfr3bQDPWvCjdW7alHBunoVVdyW2hbA&s=10' WHERE title = 'Vũ Trụ Song Song';
UPDATE movies SET poster = 'https://i.imgur.com/GmgO0gJ.jpg' WHERE title = 'Đảo Kho Báu Cuối Cùng';
UPDATE movies SET poster = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRIEuC6AS7NhMBaw8LRhJvQ1l7WQz027krMA-PZrXzw0Q&s=10' WHERE title = 'Giấc Mơ Sài Gòn';
UPDATE movies SET poster = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTPnpygqktt32cUr5PPv9nT29v9uI8kPH5FI5_m1HMzQg&s=10' WHERE title = 'Biệt Đội Ánh Sáng';
UPDATE movies SET poster = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRb7uEiyTba2wgmX_eChr9haJrlWfPw-G4PRQSznE-9yA&s=10' WHERE title = 'Ngôi Nhà Ma Ám Số 7';
UPDATE movies SET poster = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSCOBuSw18iaqPAdpGkMUW9RxkOyWc7oCBYJKoFvXHm4w&s=10' WHERE title = 'Chuyến Tàu Định Mệnh';
UPDATE movies SET poster = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSZdOiukZlRZ4upaU8KmJKmqjDI2Fq-VU7FBYbnm2WZDw&s=10' WHERE title = 'Hoàng Tử Bé Và Vùng Đất Xa Xôi';
UPDATE movies SET poster = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS1vD_arEGXFbDvy0cp8et2ozAa8Z6XRlwSgWHu4WwqZA&s=10' WHERE title = 'Nhà Hàng Của Những Giấc Mơ';
UPDATE movies SET poster = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQJsHZrfET7-_k8F7X_Cj8J93L14a65AlOwdvZsE1SOHA&s=10' WHERE title = 'The Odyssey';

-- Bat lai Safe Update Mode nhu cu sau khi chay xong.
SET SQL_SAFE_UPDATES = 1;