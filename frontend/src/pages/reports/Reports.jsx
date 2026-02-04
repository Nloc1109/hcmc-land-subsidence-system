import { useState, useEffect } from 'react';
import { Typography, Card, Row, Col, Tag, List, Progress, Divider, Statistic, Button, Spin, Select, Table, message, Modal } from 'antd';
import { BarChartOutlined, EnvironmentOutlined, AlertOutlined, WarningOutlined, RiseOutlined, ArrowLeftOutlined, CloudOutlined, EyeOutlined, CloseOutlined, ReloadOutlined } from '@ant-design/icons';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title as ChartTitle,
  Tooltip,
  Legend,
} from 'chart.js';
import AlertLevelChart from '../../components/charts/AlertLevelChart';
import './Reports.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, ChartTitle, Tooltip, Legend);

const OPEN_METEO_FORECAST = 'https://api.open-meteo.com/v1/forecast';
const OPEN_METEO_ARCHIVE = 'https://archive-api.open-meteo.com/v1/archive';

// Archive API có độ trễ ~5 ngày; dữ liệu mới nhất thường có từ (today - 5) trở về trước
const ARCHIVE_END_OFFSET_DAYS = 5;

function getDateRange(pastDays) {
  const end = new Date();
  end.setDate(end.getDate() - ARCHIVE_END_OFFSET_DAYS);
  const start = new Date(end);
  start.setDate(start.getDate() - (pastDays - 1));
  return {
    start_date: start.toISOString().slice(0, 10),
    end_date: end.toISOString().slice(0, 10),
  };
}

/** Tất cả 21 quận/huyện TP.HCM — tọa độ trung tâm (Open-Meteo) */
const DISTRICTS_WEATHER = [
  { name: 'Quận 1', lat: 10.7769, lon: 106.7009 },
  { name: 'Quận 2', lat: 10.7872, lon: 106.749 },
  { name: 'Quận 3', lat: 10.7843, lon: 106.6844 },
  { name: 'Quận 4', lat: 10.7576, lon: 106.6529 },
  { name: 'Quận 5', lat: 10.7559, lon: 106.667 },
  { name: 'Quận 6', lat: 10.7464, lon: 106.6492 },
  { name: 'Quận 7', lat: 10.7297, lon: 106.7172 },
  { name: 'Quận 8', lat: 10.7243, lon: 106.6286 },
  { name: 'Quận 10', lat: 10.7678, lon: 106.6666 },
  { name: 'Quận 11', lat: 10.7674, lon: 106.6472 },
  { name: 'Quận 12', lat: 10.8631, lon: 106.6297 },
  { name: 'Bình Thạnh', lat: 10.8106, lon: 106.7091 },
  { name: 'Gò Vấp', lat: 10.8388, lon: 106.6653 },
  { name: 'Phú Nhuận', lat: 10.8, lon: 106.6802 },
  { name: 'Tân Bình', lat: 10.8014, lon: 106.6526 },
  { name: 'Tân Phú', lat: 10.7905, lon: 106.6282 },
  { name: 'Bình Tân', lat: 10.7654, lon: 106.6033 },
  { name: 'Thành phố Thủ Đức', lat: 10.8497, lon: 106.7536 },
  { name: 'Huyện Bình Chánh', lat: 10.6964, lon: 106.5845 },
  { name: 'Huyện Cần Giờ', lat: 10.4111, lon: 106.9547 },
  { name: 'Huyện Củ Chi', lat: 11.0066, lon: 106.5142 },
  { name: 'Huyện Hóc Môn', lat: 10.8833, lon: 106.5833 },
  { name: 'Huyện Nhà Bè', lat: 10.6954, lon: 106.7452 },
];

/** Phường/xã theo từng quận/huyện TP.HCM (tọa độ gần để lấy mưa theo khu vực) */
const DISTRICT_WARDS = {
  'Quận 1': [
    { name: 'Phường Bến Nghé', lat: 10.772, lon: 106.698 },
    { name: 'Phường Bến Thành', lat: 10.776, lon: 106.702 },
    { name: 'Phường Cầu Ông Lãnh', lat: 10.768, lon: 106.696 },
    { name: 'Phường Cầu Kho', lat: 10.758, lon: 106.688 },
    { name: 'Phường Cô Giang', lat: 10.764, lon: 106.694 },
    { name: 'Phường Đa Kao', lat: 10.782, lon: 106.704 },
    { name: 'Phường Nguyễn Cư Trinh', lat: 10.766, lon: 106.686 },
    { name: 'Phường Nguyễn Thái Bình', lat: 10.774, lon: 106.696 },
    { name: 'Phường Phạm Ngũ Lão', lat: 10.768, lon: 106.692 },
    { name: 'Phường Tân Định', lat: 10.79, lon: 106.69 },
  ],
  'Quận 2': [
    { name: 'Phường Thảo Điền', lat: 10.802, lon: 106.742 },
    { name: 'Phường An Phú', lat: 10.788, lon: 106.738 },
    { name: 'Phường Bình An', lat: 10.775, lon: 106.752 },
    { name: 'Phường Bình Khánh', lat: 10.78, lon: 106.74 },
    { name: 'Phường Bình Trưng Đông', lat: 10.778, lon: 106.748 },
    { name: 'Phường Bình Trưng Tây', lat: 10.772, lon: 106.745 },
    { name: 'Phường Cát Lái', lat: 10.795, lon: 106.762 },
    { name: 'Phường An Khánh', lat: 10.792, lon: 106.735 },
    { name: 'Phường Thủ Thiêm', lat: 10.782, lon: 106.718 },
  ],
  'Quận 3': [
    { name: 'Phường 1', lat: 10.782, lon: 106.688 },
    { name: 'Phường 2', lat: 10.786, lon: 106.68 },
    { name: 'Phường 3', lat: 10.78, lon: 106.692 },
    { name: 'Phường 4', lat: 10.778, lon: 106.686 },
    { name: 'Phường 5', lat: 10.784, lon: 106.69 },
    { name: 'Phường 6', lat: 10.776, lon: 106.694 },
    { name: 'Phường 7', lat: 10.788, lon: 106.684 },
    { name: 'Phường 8', lat: 10.79, lon: 106.688 },
    { name: 'Phường 9', lat: 10.774, lon: 106.682 },
    { name: 'Phường 10', lat: 10.78, lon: 106.678 },
    { name: 'Phường 11', lat: 10.786, lon: 106.692 },
    { name: 'Phường 12', lat: 10.772, lon: 106.69 },
    { name: 'Phường 13', lat: 10.788, lon: 106.696 },
    { name: 'Phường 14', lat: 10.774, lon: 106.686 },
    { name: 'Phường Võ Thị Sáu', lat: 10.782, lon: 106.684 },
  ],
  'Quận 4': [
    { name: 'Phường 1', lat: 10.762, lon: 106.648 },
    { name: 'Phường 2', lat: 10.754, lon: 106.658 },
    { name: 'Phường 3', lat: 10.758, lon: 106.652 },
    { name: 'Phường 4', lat: 10.756, lon: 106.646 },
    { name: 'Phường 5', lat: 10.76, lon: 106.654 },
    { name: 'Phường 6', lat: 10.752, lon: 106.65 },
    { name: 'Phường 8', lat: 10.758, lon: 106.656 },
    { name: 'Phường 9', lat: 10.754, lon: 106.662 },
    { name: 'Phường 10', lat: 10.75, lon: 106.648 },
    { name: 'Phường 12', lat: 10.756, lon: 106.66 },
    { name: 'Phường 13', lat: 10.76, lon: 106.658 },
    { name: 'Phường 14', lat: 10.752, lon: 106.654 },
    { name: 'Phường 15', lat: 10.748, lon: 106.656 },
    { name: 'Phường 16', lat: 10.764, lon: 106.65 },
    { name: 'Phường 18', lat: 10.75, lon: 106.652 },
  ],
  'Quận 5': [
    { name: 'Phường 1', lat: 10.758, lon: 106.662 },
    { name: 'Phường 2', lat: 10.752, lon: 106.67 },
    { name: 'Phường 3', lat: 10.756, lon: 106.668 },
    { name: 'Phường 4', lat: 10.754, lon: 106.664 },
    { name: 'Phường 5', lat: 10.76, lon: 106.666 },
    { name: 'Phường 6', lat: 10.75, lon: 106.672 },
    { name: 'Phường 7', lat: 10.758, lon: 106.67 },
    { name: 'Phường 8', lat: 10.752, lon: 106.666 },
    { name: 'Phường 9', lat: 10.756, lon: 106.674 },
    { name: 'Phường 10', lat: 10.762, lon: 106.662 },
    { name: 'Phường 11', lat: 10.748, lon: 106.668 },
    { name: 'Phường 12', lat: 10.754, lon: 106.676 },
    { name: 'Phường 13', lat: 10.76, lon: 106.67 },
    { name: 'Phường 14', lat: 10.75, lon: 106.664 },
    { name: 'Phường 15', lat: 10.758, lon: 106.672 },
  ],
  'Quận 6': [
    { name: 'Phường 1', lat: 10.748, lon: 106.644 },
    { name: 'Phường 2', lat: 10.744, lon: 106.652 },
    { name: 'Phường 3', lat: 10.746, lon: 106.65 },
    { name: 'Phường 4', lat: 10.742, lon: 106.646 },
    { name: 'Phường 5', lat: 10.75, lon: 106.648 },
    { name: 'Phường 6', lat: 10.746, lon: 106.654 },
    { name: 'Phường 7', lat: 10.744, lon: 106.64 },
    { name: 'Phường 8', lat: 10.752, lon: 106.642 },
    { name: 'Phường 9', lat: 10.748, lon: 106.656 },
    { name: 'Phường 10', lat: 10.74, lon: 106.65 },
    { name: 'Phường 11', lat: 10.75, lon: 106.652 },
    { name: 'Phường 12', lat: 10.742, lon: 106.648 },
    { name: 'Phường 13', lat: 10.746, lon: 106.646 },
    { name: 'Phường 14', lat: 10.754, lon: 106.65 },
  ],
  'Quận 7': [
    { name: 'Phường Tân Phong', lat: 10.742, lon: 106.708 },
    { name: 'Phường Tân Phú', lat: 10.728, lon: 106.722 },
    { name: 'Phường Bình Thuận', lat: 10.735, lon: 106.715 },
    { name: 'Phường Tân Kiểng', lat: 10.738, lon: 106.712 },
    { name: 'Phường Tân Hưng', lat: 10.732, lon: 106.718 },
    { name: 'Phường Tân Quy', lat: 10.726, lon: 106.71 },
    { name: 'Phường Phú Thuận', lat: 10.73, lon: 106.72 },
    { name: 'Phường Phú Mỹ', lat: 10.74, lon: 106.705 },
  ],
  'Quận 8': [
    { name: 'Phường 1', lat: 10.728, lon: 106.622 },
    { name: 'Phường 2', lat: 10.72, lon: 106.634 },
    { name: 'Phường 3', lat: 10.724, lon: 106.63 },
    { name: 'Phường 4', lat: 10.722, lon: 106.626 },
    { name: 'Phường 5', lat: 10.73, lon: 106.628 },
    { name: 'Phường 6', lat: 10.718, lon: 106.632 },
    { name: 'Phường 7', lat: 10.726, lon: 106.624 },
    { name: 'Phường 8', lat: 10.72, lon: 106.638 },
    { name: 'Phường 9', lat: 10.732, lon: 106.62 },
    { name: 'Phường 10', lat: 10.716, lon: 106.626 },
    { name: 'Phường 11', lat: 10.724, lon: 106.636 },
    { name: 'Phường 12', lat: 10.73, lon: 106.632 },
    { name: 'Phường 13', lat: 10.722, lon: 106.63 },
    { name: 'Phường 14', lat: 10.728, lon: 106.634 },
    { name: 'Phường 15', lat: 10.718, lon: 106.628 },
    { name: 'Phường 16', lat: 10.726, lon: 106.626 },
  ],
  'Quận 10': [
    { name: 'Phường 1', lat: 10.772, lon: 106.662 },
    { name: 'Phường 2', lat: 10.764, lon: 106.67 },
    { name: 'Phường 4', lat: 10.768, lon: 106.666 },
    { name: 'Phường 5', lat: 10.766, lon: 106.658 },
    { name: 'Phường 6', lat: 10.77, lon: 106.668 },
    { name: 'Phường 7', lat: 10.762, lon: 106.672 },
    { name: 'Phường 8', lat: 10.76, lon: 106.664 },
    { name: 'Phường 9', lat: 10.774, lon: 106.66 },
    { name: 'Phường 10', lat: 10.758, lon: 106.67 },
    { name: 'Phường 11', lat: 10.768, lon: 106.662 },
    { name: 'Phường 12', lat: 10.764, lon: 106.674 },
    { name: 'Phường 13', lat: 10.77, lon: 106.656 },
    { name: 'Phường 14', lat: 10.762, lon: 106.666 },
    { name: 'Phường 15', lat: 10.766, lon: 106.652 },
  ],
  'Quận 11': [
    { name: 'Phường 1', lat: 10.77, lon: 106.642 },
    { name: 'Phường 2', lat: 10.765, lon: 106.65 },
    { name: 'Phường 3', lat: 10.768, lon: 106.648 },
    { name: 'Phường 4', lat: 10.762, lon: 106.644 },
    { name: 'Phường 5', lat: 10.772, lon: 106.646 },
    { name: 'Phường 6', lat: 10.766, lon: 106.652 },
    { name: 'Phường 7', lat: 10.76, lon: 106.64 },
    { name: 'Phường 8', lat: 10.774, lon: 106.642 },
    { name: 'Phường 9', lat: 10.768, lon: 106.654 },
    { name: 'Phường 10', lat: 10.762, lon: 106.65 },
    { name: 'Phường 11', lat: 10.77, lon: 106.638 },
    { name: 'Phường 12', lat: 10.764, lon: 106.646 },
    { name: 'Phường 13', lat: 10.776, lon: 106.644 },
    { name: 'Phường 14', lat: 10.758, lon: 106.648 },
    { name: 'Phường 15', lat: 10.772, lon: 106.65 },
    { name: 'Phường 16', lat: 10.766, lon: 106.638 },
  ],
  'Quận 12': [
    { name: 'Phường Thới An', lat: 10.872, lon: 106.642 },
    { name: 'Phường Tân Chánh Hiệp', lat: 10.868, lon: 106.628 },
    { name: 'Phường Đông Hưng Thuận', lat: 10.862, lon: 106.635 },
    { name: 'Phường Tân Thới Hiệp', lat: 10.878, lon: 106.638 },
    { name: 'Phường Trung Mỹ Tây', lat: 10.858, lon: 106.618 },
    { name: 'Phường An Phú Đông', lat: 10.865, lon: 106.635 },
    { name: 'Phường Tân Thới Nhất', lat: 10.875, lon: 106.612 },
    { name: 'Phường Thạnh Lộc', lat: 10.87, lon: 106.648 },
    { name: 'Phường Hiệp Thành', lat: 10.86, lon: 106.622 },
    { name: 'Phường Trung Mỹ Đông', lat: 10.855, lon: 106.632 },
  ],
  'Bình Thạnh': [
    { name: 'Phường 1', lat: 10.808, lon: 106.712 },
    { name: 'Phường 2', lat: 10.815, lon: 106.705 },
    { name: 'Phường 3', lat: 10.812, lon: 106.708 },
    { name: 'Phường 5', lat: 10.806, lon: 106.716 },
    { name: 'Phường 6', lat: 10.81, lon: 106.702 },
    { name: 'Phường 7', lat: 10.818, lon: 106.71 },
    { name: 'Phường 11', lat: 10.802, lon: 106.718 },
    { name: 'Phường 12', lat: 10.816, lon: 106.698 },
    { name: 'Phường 13', lat: 10.804, lon: 106.706 },
    { name: 'Phường 14', lat: 10.802, lon: 106.718 },
    { name: 'Phường 15', lat: 10.814, lon: 106.712 },
    { name: 'Phường 17', lat: 10.808, lon: 106.704 },
    { name: 'Phường 19', lat: 10.81, lon: 106.714 },
    { name: 'Phường 21', lat: 10.8, lon: 106.71 },
    { name: 'Phường 22', lat: 10.812, lon: 106.716 },
    { name: 'Phường 24', lat: 10.806, lon: 106.698 },
    { name: 'Phường 25', lat: 10.818, lon: 106.706 },
    { name: 'Phường 26', lat: 10.804, lon: 106.712 },
    { name: 'Phường 27', lat: 10.81, lon: 106.72 },
    { name: 'Phường 28', lat: 10.802, lon: 106.704 },
  ],
  'Gò Vấp': [
    { name: 'Phường 1', lat: 10.842, lon: 106.668 },
    { name: 'Phường 3', lat: 10.835, lon: 106.658 },
    { name: 'Phường 4', lat: 10.838, lon: 106.662 },
    { name: 'Phường 5', lat: 10.848, lon: 106.672 },
    { name: 'Phường 6', lat: 10.832, lon: 106.665 },
    { name: 'Phường 7', lat: 10.845, lon: 106.66 },
    { name: 'Phường 8', lat: 10.84, lon: 106.67 },
    { name: 'Phường 9', lat: 10.836, lon: 106.672 },
    { name: 'Phường 10', lat: 10.844, lon: 106.658 },
    { name: 'Phường 11', lat: 10.83, lon: 106.668 },
    { name: 'Phường 12', lat: 10.846, lon: 106.666 },
    { name: 'Phường 13', lat: 10.834, lon: 106.662 },
    { name: 'Phường 14', lat: 10.84, lon: 106.674 },
    { name: 'Phường 15', lat: 10.832, lon: 106.67 },
    { name: 'Phường 16', lat: 10.848, lon: 106.664 },
    { name: 'Phường 17', lat: 10.838, lon: 106.656 },
  ],
  'Phú Nhuận': [
    { name: 'Phường 1', lat: 10.802, lon: 106.678 },
    { name: 'Phường 2', lat: 10.798, lon: 106.682 },
    { name: 'Phường 3', lat: 10.804, lon: 106.684 },
    { name: 'Phường 4', lat: 10.8, lon: 106.676 },
    { name: 'Phường 5', lat: 10.796, lon: 106.68 },
    { name: 'Phường 7', lat: 10.806, lon: 106.68 },
    { name: 'Phường 8', lat: 10.8, lon: 106.682 },
    { name: 'Phường 9', lat: 10.798, lon: 106.674 },
    { name: 'Phường 10', lat: 10.804, lon: 106.678 },
    { name: 'Phường 11', lat: 10.792, lon: 106.678 },
    { name: 'Phường 12', lat: 10.802, lon: 106.672 },
    { name: 'Phường 13', lat: 10.796, lon: 106.676 },
    { name: 'Phường 14', lat: 10.806, lon: 106.674 },
    { name: 'Phường 15', lat: 10.8, lon: 106.684 },
    { name: 'Phường 17', lat: 10.794, lon: 106.682 },
  ],
  'Tân Bình': [
    { name: 'Phường 1', lat: 10.804, lon: 106.648 },
    { name: 'Phường 2', lat: 10.798, lon: 106.656 },
    { name: 'Phường 3', lat: 10.802, lon: 106.652 },
    { name: 'Phường 4', lat: 10.796, lon: 106.65 },
    { name: 'Phường 5', lat: 10.808, lon: 106.654 },
    { name: 'Phường 6', lat: 10.8, lon: 106.658 },
    { name: 'Phường 7', lat: 10.806, lon: 106.646 },
    { name: 'Phường 8', lat: 10.794, lon: 106.652 },
    { name: 'Phường 9', lat: 10.81, lon: 106.65 },
    { name: 'Phường 10', lat: 10.802, lon: 106.66 },
    { name: 'Phường 11', lat: 10.796, lon: 106.648 },
    { name: 'Phường 12', lat: 10.804, lon: 106.656 },
    { name: 'Phường 13', lat: 10.8, lon: 106.644 },
    { name: 'Phường 14', lat: 10.798, lon: 106.662 },
    { name: 'Phường 15', lat: 10.806, lon: 106.652 },
  ],
  'Tân Phú': [
    { name: 'Phường Tân Sơn Nhì', lat: 10.798, lon: 106.622 },
    { name: 'Phường Tây Thạnh', lat: 10.785, lon: 106.635 },
    { name: 'Phường Sơn Kỳ', lat: 10.792, lon: 106.628 },
    { name: 'Phường Tân Quý', lat: 10.788, lon: 106.618 },
    { name: 'Phường Tân Thành', lat: 10.782, lon: 106.632 },
    { name: 'Phường Phú Thọ Hòa', lat: 10.796, lon: 106.626 },
    { name: 'Phường Hiệp Tân', lat: 10.79, lon: 106.624 },
    { name: 'Phường Hòa Thạnh', lat: 10.786, lon: 106.63 },
    { name: 'Phường Phú Thạnh', lat: 10.794, lon: 106.634 },
    { name: 'Phường Tân Thới Hòa', lat: 10.78, lon: 106.62 },
    { name: 'Phường Tân Hòa Đông', lat: 10.776, lon: 106.628 },
  ],
  'Bình Tân': [
    { name: 'Phường Bình Hưng Hòa', lat: 10.772, lon: 106.598 },
    { name: 'Phường Bình Hưng Hòa A', lat: 10.77, lon: 106.602 },
    { name: 'Phường Bình Hưng Hòa B', lat: 10.774, lon: 106.594 },
    { name: 'Phường Bình Trị Đông', lat: 10.758, lon: 106.608 },
    { name: 'Phường Bình Trị Đông A', lat: 10.756, lon: 106.612 },
    { name: 'Phường Bình Trị Đông B', lat: 10.76, lon: 106.604 },
    { name: 'Phường Tân Tạo', lat: 10.768, lon: 106.588 },
    { name: 'Phường Tân Tạo A', lat: 10.766, lon: 106.592 },
    { name: 'Phường An Lạc', lat: 10.765, lon: 106.615 },
    { name: 'Phường An Lạc A', lat: 10.762, lon: 106.618 },
  ],
  'Thành phố Thủ Đức': [
    { name: 'Phường Linh Trung', lat: 10.858, lon: 106.752 },
    { name: 'Phường Linh Chiểu', lat: 10.848, lon: 106.748 },
    { name: 'Phường Tam Bình', lat: 10.842, lon: 106.758 },
    { name: 'Phường Tam Phú', lat: 10.838, lon: 106.754 },
    { name: 'Phường Hiệp Bình Chánh', lat: 10.852, lon: 106.742 },
    { name: 'Phường Hiệp Bình Phước', lat: 10.845, lon: 106.738 },
    { name: 'Phường Linh Đông', lat: 10.84, lon: 106.748 },
    { name: 'Phường Linh Tây', lat: 10.844, lon: 106.752 },
    { name: 'Phường Thủ Đức', lat: 10.848, lon: 106.762 },
    { name: 'Phường Trường Thọ', lat: 10.855, lon: 106.758 },
    { name: 'Phường Long Bình', lat: 10.862, lon: 106.768 },
    { name: 'Phường Long Thạnh Mỹ', lat: 10.85, lon: 106.772 },
    { name: 'Phường Tân Phú', lat: 10.846, lon: 106.764 },
    { name: 'Phường Hiệp Phú', lat: 10.84, lon: 106.768 },
    { name: 'Phường Tăng Nhơn Phú A', lat: 10.836, lon: 106.76 },
    { name: 'Phường Tăng Nhơn Phú B', lat: 10.832, lon: 106.756 },
    { name: 'Phường Phước Long B', lat: 10.854, lon: 106.776 },
    { name: 'Phường Long Trường', lat: 10.856, lon: 106.762 },
    { name: 'Phường Phước Bình', lat: 10.86, lon: 106.758 },
  ],
  'Huyện Bình Chánh': [
    { name: 'Thị trấn Tân Túc', lat: 10.688, lon: 106.572 },
    { name: 'Xã Tân Quý Tây', lat: 10.702, lon: 106.578 },
    { name: 'Xã Quy Đức', lat: 10.695, lon: 106.565 },
    { name: 'Xã Vĩnh Lộc A', lat: 10.69, lon: 106.59 },
    { name: 'Xã Vĩnh Lộc B', lat: 10.685, lon: 106.598 },
    { name: 'Xã Bình Lợi', lat: 10.678, lon: 106.582 },
    { name: 'Xã Lê Minh Xuân', lat: 10.672, lon: 106.575 },
    { name: 'Xã Tân Nhựt', lat: 10.698, lon: 106.568 },
    { name: 'Xã Tân Kiên', lat: 10.708, lon: 106.585 },
    { name: 'Xã Bình Hưng', lat: 10.682, lon: 106.59 },
    { name: 'Xã Phong Phú', lat: 10.675, lon: 106.568 },
    { name: 'Xã An Phú Tây', lat: 10.69, lon: 106.558 },
    { name: 'Xã Hưng Long', lat: 10.705, lon: 106.562 },
    { name: 'Xã Đa Phước', lat: 10.665, lon: 106.578 },
    { name: 'Xã Tân Quý Đông', lat: 10.7, lon: 106.572 },
  ],
  'Huyện Cần Giờ': [
    { name: 'Thị trấn Cần Thạnh', lat: 10.41, lon: 106.96 },
    { name: 'Xã Long Hòa', lat: 10.398, lon: 106.94 },
    { name: 'Xã Tam Thôn Hiệp', lat: 10.42, lon: 106.968 },
    { name: 'Xã An Thới Đông', lat: 10.405, lon: 106.95 },
    { name: 'Xã Thạnh An', lat: 10.385, lon: 106.952 },
    { name: 'Xã Lý Nhơn', lat: 10.432, lon: 106.958 },
    { name: 'Xã Bình Khánh', lat: 10.415, lon: 106.94 },
    { name: 'Xã Cần Thạnh', lat: 10.408, lon: 106.962 },
  ],
  'Huyện Củ Chi': [
    { name: 'Thị trấn Củ Chi', lat: 11.008, lon: 106.51 },
    { name: 'Xã Phú Mỹ Hưng', lat: 10.995, lon: 106.52 },
    { name: 'Xã Trung Lập Thượng', lat: 11.018, lon: 106.508 },
    { name: 'Xã Trung Lập Hạ', lat: 11.002, lon: 106.505 },
    { name: 'Xã Tân An Hội', lat: 10.988, lon: 106.515 },
    { name: 'Xã Phước Hiệp', lat: 11.022, lon: 106.512 },
    { name: 'Xã Phước Thạnh', lat: 10.978, lon: 106.508 },
    { name: 'Xã Tân Thông Hội', lat: 10.992, lon: 106.502 },
    { name: 'Xã Hòa Phú', lat: 11.015, lon: 106.518 },
    { name: 'Xã An Nhơn Tây', lat: 10.985, lon: 106.525 },
    { name: 'Xã Nhuận Đức', lat: 11.01, lon: 106.498 },
    { name: 'Xã Phạm Văn Cội', lat: 10.998, lon: 106.532 },
    { name: 'Xã Phú Hòa Đông', lat: 10.972, lon: 106.515 },
    { name: 'Xã Trung An', lat: 11.005, lon: 106.52 },
    { name: 'Xã Tân Phú Trung', lat: 10.98, lon: 106.52 },
  ],
  'Huyện Hóc Môn': [
    { name: 'Thị trấn Hóc Môn', lat: 10.885, lon: 106.578 },
    { name: 'Xã Tân Hiệp', lat: 10.878, lon: 106.59 },
    { name: 'Xã Đông Thạnh', lat: 10.89, lon: 106.572 },
    { name: 'Xã Tân Thới Nhì', lat: 10.882, lon: 106.598 },
    { name: 'Xã Thới Tam Thôn', lat: 10.875, lon: 106.568 },
    { name: 'Xã Xuân Thới Sơn', lat: 10.868, lon: 106.582 },
    { name: 'Xã Tân Xuân', lat: 10.892, lon: 106.585 },
    { name: 'Xã Xuân Thới Đông', lat: 10.88, lon: 106.562 },
    { name: 'Xã Trung Chánh', lat: 10.872, lon: 106.576 },
    { name: 'Xã Xuân Thới Thượng', lat: 10.865, lon: 106.59 },
    { name: 'Xã Bà Điểm', lat: 10.878, lon: 106.565 },
  ],
  'Huyện Nhà Bè': [
    { name: 'Thị trấn Nhà Bè', lat: 10.698, lon: 106.742 },
    { name: 'Xã Phước Kiển', lat: 10.688, lon: 106.752 },
    { name: 'Xã Hiệp Phước', lat: 10.692, lon: 106.738 },
    { name: 'Xã Nhơn Đức', lat: 10.678, lon: 106.745 },
    { name: 'Xã Phú Xuân', lat: 10.682, lon: 106.755 },
    { name: 'Xã Long Thới', lat: 10.672, lon: 106.738 },
    { name: 'Xã Phước Lộc', lat: 10.685, lon: 106.748 },
  ],
};

const { Title, Paragraph, Text } = Typography;

const getRiskColor = (riskLevel) => {
  switch (riskLevel) {
    case 'Rất cao':
      return 'red';
    case 'Cao':
      return 'orange';
    case 'Trung bình':
      return 'blue';
    case 'Thấp':
    default:
      return 'green';
  }
};

/** Chỉ gọi khi người dùng chọn xem thống kê — không chạy lúc load trang báo cáo */
function generateDistrictReports() {
  const districtNames = [
    'Quận 1', 'Quận 3', 'Quận 4', 'Quận 5', 'Quận 6', 'Quận 7', 'Quận 8', 'Quận 10', 'Quận 11', 'Quận 12',
    'Bình Thạnh', 'Gò Vấp', 'Phú Nhuận', 'Tân Bình', 'Tân Phú', 'Bình Tân', 'Thành phố Thủ Đức',
    'Huyện Bình Chánh', 'Huyện Cần Giờ', 'Huyện Củ Chi', 'Huyện Hóc Môn', 'Huyện Nhà Bè',
  ];
  return districtNames.map((name, index) => {
    const baseRate = 2.5 + (index % 5);
    const alerts = 3 + (index % 10);
    const totalWards = 7 + (index % 5);
    const activeWards = Math.max(1, Math.min(totalWards, Math.floor(totalWards * 0.6)));
    let riskLevel = 'Thấp';
    if (baseRate >= 6) riskLevel = 'Rất cao';
    else if (baseRate >= 4.5) riskLevel = 'Cao';
    else if (baseRate >= 3.5) riskLevel = 'Trung bình';
    const wards = [
      { wardName: 'Phường 1', activeStations: 2, avgRate: baseRate + 0.3, alerts: Math.max(1, alerts - 2), riskLevel },
      { wardName: 'Phường 2', activeStations: 1, avgRate: baseRate, alerts: Math.max(0, alerts - 4), riskLevel: riskLevel === 'Thấp' ? 'Thấp' : 'Trung bình' },
      { wardName: 'Phường 3', activeStations: 1, avgRate: baseRate - 0.4, alerts: 1, riskLevel: 'Thấp' },
    ];
    return { districtName: name, totalWards, activeWards, avgRate: baseRate, alerts, riskLevel, wards };
  });
}

const VIEW_MAIN = 'main';
const VIEW_DISTRICT_STATS = 'district-stats';

const ReportsPage = () => {
  const [view, setView] = useState(VIEW_MAIN);
  const [districtData, setDistrictData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [weatherRainfallData, setWeatherRainfallData] = useState([]);
  const [weatherRainfallLoading, setWeatherRainfallLoading] = useState(false);
  const [weatherPastDays, setWeatherPastDays] = useState(7);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailDistrict, setDetailDistrict] = useState(null);
  const [detailWardData, setDetailWardData] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showDistrictCard, setShowDistrictCard] = useState(true);
  const [showWeatherCard, setShowWeatherCard] = useState(true);

  useEffect(() => {
    if (view !== VIEW_DISTRICT_STATS) return;
    setLoading(true);
    const timer = setTimeout(() => {
      setDistrictData(generateDistrictReports());
      setLoading(false);
    }, 100);
    return () => clearTimeout(timer);
  }, [view]);

  const goToDistrictStats = () => setView(VIEW_DISTRICT_STATS);

  const backToReports = () => {
    setView(VIEW_MAIN);
    setDistrictData([]);
  };

  const refreshDistrictStats = () => {
    setLoading(true);
    setDistrictData([]);
    setTimeout(() => {
      setDistrictData(generateDistrictReports());
      setLoading(false);
      message.success('Đã tải lại dữ liệu thống kê quận/huyện.');
    }, 100);
  };

  const fetchOneDistrictWeather = async (d, startDate, endDate, useArchive) => {
    const base = useArchive ? OPEN_METEO_ARCHIVE : OPEN_METEO_FORECAST;
    const url = useArchive
      ? `${base}?latitude=${d.lat}&longitude=${d.lon}&start_date=${startDate}&end_date=${endDate}&daily=precipitation_sum&hourly=temperature_2m,relative_humidity_2m&timezone=Asia/Ho_Chi_Minh`
      : `${base}?latitude=${d.lat}&longitude=${d.lon}&past_days=${weatherPastDays}&hourly=precipitation,temperature_2m,relative_humidity_2m&timezone=Asia/Ho_Chi_Minh`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    let totalMm = 0;
    let numDays = 0;
    if (useArchive && json.daily?.precipitation_sum) {
      const dailyPrecip = json.daily.precipitation_sum || [];
      numDays = dailyPrecip.length;
      totalMm = dailyPrecip.reduce((sum, v) => sum + (Number(v) || 0), 0);
    } else {
      const times = json.hourly?.time || [];
      const precip = json.hourly?.precipitation || [];
      totalMm = precip.reduce((sum, v) => sum + (Number(v) || 0), 0);
      numDays = weatherPastDays;
    }
    const avgPerDay = numDays > 0 ? totalMm / numDays : 0;
    const temp = json.hourly?.temperature_2m || [];
    const humidity = json.hourly?.relative_humidity_2m || [];
    const avgTemp = temp.length ? temp.reduce((s, v) => s + (Number(v) || 0), 0) / temp.length : null;
    const avgHumidity = humidity.length ? humidity.reduce((s, v) => s + (Number(v) || 0), 0) / humidity.length : null;
    return {
      districtName: d.name,
      totalMm: Math.round(totalMm * 10) / 10,
      avgPerDayMm: Math.round(avgPerDay * 10) / 10,
      avgTemp: avgTemp != null ? Math.round(avgTemp * 10) / 10 : null,
      avgHumidity: avgHumidity != null ? Math.round(avgHumidity) : null,
      days: weatherPastDays,
    };
  };

  const handleLoadWeatherRainfall = async () => {
    setWeatherRainfallLoading(true);
    setWeatherRainfallData([]);
    const { start_date, end_date } = getDateRange(weatherPastDays);
    try {
      let results = [];
      try {
        results = await Promise.all(
          DISTRICTS_WEATHER.map((d) => fetchOneDistrictWeather(d, start_date, end_date, true))
        );
      } catch (archiveErr) {
        console.warn('Archive API failed, using forecast:', archiveErr);
        results = await Promise.all(
          DISTRICTS_WEATHER.map((d) => fetchOneDistrictWeather(d, null, null, false))
        );
      }
      setWeatherRainfallData(results);
      message.success(`Đã tải thời tiết & lượng mưa ${weatherPastDays} ngày qua cho ${results.length} quận.`);
    } catch (err) {
      console.error('Error fetching weather/rainfall:', err);
      message.error('Không tải được dữ liệu từ Open-Meteo. Vui lòng thử lại.');
      setWeatherRainfallData([]);
    } finally {
      setWeatherRainfallLoading(false);
    }
  };

  const handleOpenRainfallDetail = async (districtName) => {
    const wards = DISTRICT_WARDS[districtName];
    if (!wards || wards.length === 0) {
      message.info('Chưa có dữ liệu chi tiết theo phường/xã cho quận này.');
      return;
    }
    setDetailDistrict(districtName);
    setDetailModalOpen(true);
    setDetailLoading(true);
    setDetailWardData([]);
    const { start_date, end_date } = getDateRange(weatherPastDays);
    try {
      const fetchWard = async (w, useArchive = true) => {
        const base = useArchive ? OPEN_METEO_ARCHIVE : OPEN_METEO_FORECAST;
        const url = useArchive
          ? `${base}?latitude=${w.lat}&longitude=${w.lon}&start_date=${start_date}&end_date=${end_date}&daily=precipitation_sum&timezone=Asia/Ho_Chi_Minh`
          : `${base}?latitude=${w.lat}&longitude=${w.lon}&past_days=${weatherPastDays}&hourly=precipitation&timezone=Asia/Ho_Chi_Minh`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        let totalMm = 0;
        const byDay = {};
        if (useArchive && json.daily?.precipitation_sum && json.daily?.time) {
          json.daily.time.forEach((day, i) => {
            const d = day.slice(0, 10);
            const v = Number(json.daily.precipitation_sum[i]) || 0;
            byDay[d] = v;
            totalMm += v;
          });
        } else {
          const times = json.hourly?.time || [];
          const precip = json.hourly?.precipitation || [];
          totalMm = precip.reduce((sum, v) => sum + (Number(v) || 0), 0);
          times.forEach((t, i) => {
            const day = t.slice(0, 10);
            if (!byDay[day]) byDay[day] = 0;
            byDay[day] += Number(precip[i]) || 0;
          });
        }
        return { wardName: w.name, totalMm: Math.round(totalMm * 10) / 10, byDay };
      };
      let wardResults = [];
      try {
        wardResults = await Promise.all(wards.map((w) => fetchWard(w, true)));
      } catch (e) {
        wardResults = await Promise.all(wards.map((w) => fetchWard(w, false)));
      }
      setDetailWardData(wardResults);
    } catch (err) {
      console.error('Error fetching ward rainfall:', err);
      message.error('Không tải được dữ liệu chi tiết.');
      setDetailWardData([]);
    } finally {
      setDetailLoading(false);
    }
  };

  if (view === VIEW_DISTRICT_STATS) {
    return (
      <div className="page-container reports-sub-view">
        <div className="reports-sub-view-header">
          <div className="reports-sub-view-actions">
            <Button type="default" icon={<ArrowLeftOutlined />} onClick={backToReports} className="reports-back-btn">
              Đóng (Quay lại)
            </Button>
            <Button type="primary" icon={<ReloadOutlined />} onClick={refreshDistrictStats} loading={loading}>
              Làm mới
            </Button>
          </div>
          <Title level={3} className="section-title">
            <EnvironmentOutlined /> Thống kê theo quận/huyện & phường/xã
          </Title>
          <Paragraph type="secondary">
            Danh sách chi tiết từng quận/huyện và phường/xã. Bấm &quot;Đóng&quot; để quay lại trang báo cáo.
          </Paragraph>
        </div>

        {loading ? (
          <div className="reports-sub-view-loading">
            <Spin size="large" tip="Đang tải dữ liệu thống kê..." />
          </div>
        ) : (
          <>
            <Row gutter={[24, 24]}>
              {districtData.map((district) => (
                <Col xs={24} lg={12} key={district.districtName}>
                  <Card
                    className="page-card district-card"
                    title={
                      <div className="district-card-header">
                        <span className="district-name">{district.districtName}</span>
                        <Tag color={getRiskColor(district.riskLevel)}>{district.riskLevel}</Tag>
                      </div>
                    }
                    extra={
                      <div className="district-summary">
                        <span>Phường có hoạt động: <Text strong>{district.activeWards}/{district.totalWards}</Text></span>
                        <span>Cảnh báo: <Text strong><AlertOutlined /> {district.alerts}</Text></span>
                      </div>
                    }
                  >
                    <Row gutter={16} style={{ marginBottom: 16 }}>
                      <Col span={16}>
                        <div className="district-progress">
                          <Text type="secondary">Tốc độ sụt lún trung bình (mm/năm)</Text>
                          <Progress
                            percent={Math.min((district.avgRate / 8) * 100, 100)}
                            status="active"
                            format={() => `${district.avgRate.toFixed(1)} mm/năm`}
                          />
                        </div>
                      </Col>
                      <Col span={8} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ textAlign: 'center' }}>
                          <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: 4 }}>Mức cảnh báo</Text>
                          <AlertLevelChart alerts={district.alerts} maxAlerts={10} size={80} />
                        </div>
                      </Col>
                    </Row>
                    <div className="wards-list">
                      <List
                        header={
                          <div className="wards-header">
                            <span>Phường/xã</span><span>Trạm đo</span><span>Tốc độ TB (mm/năm)</span><span>Cảnh báo</span><span>Mức rủi ro</span>
                          </div>
                        }
                        dataSource={district.wards}
                        renderItem={(ward) => (
                          <List.Item className="ward-row">
                            <span className="ward-name">{ward.wardName}</span>
                            <span>{ward.activeStations}</span>
                            <span>{ward.avgRate.toFixed(1)}</span>
                            <span><AlertOutlined style={{ marginRight: 4 }} />{ward.alerts}</span>
                            <span><Tag color={getRiskColor(ward.riskLevel)}>{ward.riskLevel}</Tag></span>
                          </List.Item>
                        )}
                      />
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>

            <Divider />

            <section className="reports-city-overview">
              <Title level={4} className="section-title">
                <BarChartOutlined /> Tổng quan thống kê toàn thành phố Hồ Chí Minh
              </Title>
              <Card className="page-card" style={{ marginTop: 16 }}>
                <Row gutter={[24, 24]}>
                  <Col xs={24} sm={12} md={6}>
                    <Statistic title="Tổng số quận/huyện" value={districtData.length} prefix={<EnvironmentOutlined />} valueStyle={{ color: '#1890ff' }} />
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Statistic title="Tổng số phường/xã" value={districtData.reduce((s, d) => s + d.totalWards, 0)} prefix={<EnvironmentOutlined />} valueStyle={{ color: '#52c41a' }} />
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Statistic title="Phường có hoạt động sụt lún" value={districtData.reduce((s, d) => s + d.activeWards, 0)} prefix={<WarningOutlined />} valueStyle={{ color: '#faad14' }} />
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Statistic title="Tổng số cảnh báo" value={districtData.reduce((s, d) => s + d.alerts, 0)} prefix={<AlertOutlined />} valueStyle={{ color: '#ff4d4f' }} />
                  </Col>
                </Row>
                <Divider />
                <Row gutter={[24, 24]}>
                  <Col xs={24} md={12}>
                    <Card title="Phân bố mức rủi ro theo quận/huyện" size="small">
                      <Row gutter={[16, 16]}>
                        {['Rất cao', 'Cao', 'Trung bình', 'Thấp'].map((level) => {
                          const count = districtData.filter((d) => d.riskLevel === level).length;
                          const percentage = districtData.length ? ((count / districtData.length) * 100).toFixed(1) : 0;
                          return (
                            <Col span={24} key={level}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <Tag color={getRiskColor(level)}>{level}</Tag>
                                  <Text>{count} quận/huyện</Text>
                                </div>
                                <Text strong>{percentage}%</Text>
                              </div>
                              <Progress percent={parseFloat(percentage)} strokeColor={getRiskColor(level)} showInfo={false} style={{ marginTop: 4 }} />
                            </Col>
                          );
                        })}
                      </Row>
                    </Card>
                  </Col>
                  <Col xs={24} md={12}>
                    <Card title="Tốc độ sụt lún trung bình" size="small">
                      <Row gutter={[16, 16]}>
                        <Col span={24}>
                          <Statistic
                            title="Tốc độ trung bình toàn thành phố"
                            value={districtData.length ? (districtData.reduce((s, d) => s + d.avgRate, 0) / districtData.length).toFixed(2) : '-'}
                            suffix="mm/năm"
                            prefix={<RiseOutlined />}
                            valueStyle={{ color: '#1890ff', fontSize: '24px' }}
                          />
                        </Col>
                        {districtData.length > 0 && (
                          <>
                            <Col span={24}>
                              <Text type="secondary" style={{ fontSize: '12px' }}>
                                Cao nhất: <Text strong>{Math.max(...districtData.map((d) => d.avgRate)).toFixed(2)} mm/năm</Text>
                                {' - '}{districtData.find((d) => d.avgRate === Math.max(...districtData.map((d) => d.avgRate)))?.districtName}
                              </Text>
                            </Col>
                            <Col span={24}>
                              <Text type="secondary" style={{ fontSize: '12px' }}>
                                Thấp nhất: <Text strong>{Math.min(...districtData.map((d) => d.avgRate)).toFixed(2)} mm/năm</Text>
                                {' - '}{districtData.find((d) => d.avgRate === Math.min(...districtData.map((d) => d.avgRate)))?.districtName}
                              </Text>
                            </Col>
                          </>
                        )}
                      </Row>
                    </Card>
                  </Col>
                </Row>
                <Divider />
                <Card title="Top 5 quận/huyện có mức cảnh báo cao nhất" size="small">
                  <List
                    dataSource={[...districtData].sort((a, b) => b.alerts - a.alerts).slice(0, 5)}
                    renderItem={(district, index) => (
                      <List.Item>
                        <List.Item.Meta
                          avatar={
                            <div style={{
                              width: 32, height: 32, borderRadius: '50%',
                              background: index === 0 ? '#ff4d4f' : index === 1 ? '#ff7875' : index === 2 ? '#ffa39e' : '#f0f0f0',
                              color: index < 3 ? '#fff' : '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold',
                            }}>{index + 1}</div>
                          }
                          title={<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Text strong>{district.districtName}</Text><Tag color={getRiskColor(district.riskLevel)}>{district.riskLevel}</Tag></div>}
                          description={
                            <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
                              <Text type="secondary"><AlertOutlined /> {district.alerts} cảnh báo</Text>
                              <Text type="secondary">Tốc độ: {district.avgRate.toFixed(1)} mm/năm</Text>
                              <Text type="secondary">Phường: {district.activeWards}/{district.totalWards}</Text>
                            </div>
                          }
                        />
                      </List.Item>
                    )}
                  />
                </Card>
              </Card>
            </section>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="page-container reports-page">
      <div className="page-header reports-page-header">
        <Title level={2}>
          <BarChartOutlined /> Báo cáo giám sát sụt lún
        </Title>
        <Paragraph type="secondary" className="reports-page-subtitle">
          Tổng hợp các báo cáo, biểu đồ và số liệu thống kê chi tiết theo khu vực, thời gian và loại chỉ số.
        </Paragraph>
      </div>

      <Row gutter={[32, 32]} className="reports-summary-row">
        <Col xs={24} md={8}>
          <Card className="page-card reports-summary-card" title="Tổng quan toàn thành phố">
            <Text type="secondary" className="reports-summary-text">
              Xem nhanh tổng số quận/huyện, phường/xã có hoạt động sụt lún và mức độ rủi ro chung.
            </Text>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="page-card reports-summary-card" title="Báo cáo theo quận/huyện">
            <Text type="secondary" className="reports-summary-text">
              Thống kê chi tiết số phường có hoạt động sụt lún, tốc độ trung bình và số lượng cảnh báo.
            </Text>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="page-card reports-summary-card" title="Báo cáo theo phường/xã">
            <Text type="secondary" className="reports-summary-text">
              Danh sách từng phường/xã có hoạt động sụt lún kèm mức độ rủi ro và số trạm đo.
            </Text>
          </Card>
        </Col>
      </Row>

      <Divider className="reports-divider" />

      {showDistrictCard ? (
        <section className="reports-district-cta">
          <Card className="page-card reports-district-cta-card">
            <div className="reports-district-cta-content">
              <Title level={4} className="section-title">
                <EnvironmentOutlined /> Thống kê theo quận/huyện & phường/xã
              </Title>
              <Paragraph type="secondary">
                Mỗi khối thể hiện chi tiết một quận/huyện, bao gồm số phường có hoạt động sụt lún và trạng thái rủi ro từng phường. Dữ liệu chỉ tải khi bạn chọn xem.
              </Paragraph>
              <Button type="primary" size="large" onClick={goToDistrictStats} className="reports-district-cta-btn">
                Xem thống kê theo quận/huyện & phường/xã
              </Button>
            </div>
          </Card>
        </section>
      ) : (
        <section className="reports-district-cta">
          <div className="reports-card-closed">
            <Text type="secondary">Card thống kê quận/huyện đã đóng.</Text>
            <Button type="link" size="small" onClick={() => setShowDistrictCard(true)}>Hiển thị lại</Button>
          </div>
        </section>
      )}

      {showWeatherCard ? (
        <section className="reports-weather-cta">
          <Card className="page-card reports-weather-cta-card">
            <div className="reports-weather-cta-content">
              <div className={weatherRainfallData.length > 0 ? 'reports-card-header-actions' : ''}>
                <Title level={4} className="section-title">
                  <CloudOutlined /> Thống kê thời tiết & lượng mưa
                </Title>
                {weatherRainfallData.length > 0 && (
                  <div className="reports-card-buttons">
                    <Button type="default" size="small" icon={<CloseOutlined />} onClick={() => setWeatherRainfallData([])}>
                      Đóng
                    </Button>
                    <Button type="primary" size="small" icon={<ReloadOutlined />} onClick={handleLoadWeatherRainfall} loading={weatherRainfallLoading}>
                      Làm mới
                    </Button>
                  </div>
                )}
              </div>
            <Paragraph type="secondary">
              Dữ liệu từ Open-Meteo theo tọa độ trung tâm từng quận: lượng mưa (mm), nhiệt độ trung bình (°C), độ ẩm (%). Chọn khoảng thời gian và bấm xem.
            </Paragraph>
            <Paragraph type="secondary" style={{ marginTop: -8, fontSize: 13 }}>
              Lượng mưa dùng dữ liệu lịch sử (độ trễ khoảng 5 ngày so với hiện tại) nên phản ánh đúng thực tế; nếu chọn &quot;7 ngày qua&quot; thì là 7 ngày kết thúc cách đây 5 ngày.
            </Paragraph>
            <div className="reports-weather-actions">
              <Select
                value={weatherPastDays}
                onChange={setWeatherPastDays}
                options={[
                  { label: '7 ngày qua', value: 7 },
                  { label: '14 ngày qua', value: 14 },
                ]}
                style={{ width: 160 }}
              />
              <Button
                type="primary"
                size="large"
                icon={<CloudOutlined />}
                loading={weatherRainfallLoading}
                onClick={handleLoadWeatherRainfall}
                className="reports-weather-cta-btn"
              >
                Xem thống kê thời tiết & lượng mưa
              </Button>
            </div>
            {weatherRainfallData.length > 0 && (
              <Table
                size="small"
                dataSource={weatherRainfallData}
                rowKey="districtName"
                pagination={false}
                columns={[
                  { title: 'Quận / Huyện', dataIndex: 'districtName', key: 'districtName', width: 140 },
                  { title: 'Tổng mưa (mm)', dataIndex: 'totalMm', key: 'totalMm', align: 'right', render: (v) => v?.toFixed(1) ?? '-' },
                  { title: 'TB mưa/ngày (mm)', dataIndex: 'avgPerDayMm', key: 'avgPerDayMm', align: 'right', render: (v) => v?.toFixed(1) ?? '-' },
                  { title: 'Nhiệt độ TB (°C)', dataIndex: 'avgTemp', key: 'avgTemp', align: 'right', render: (v) => (v != null ? v.toFixed(1) : '-') },
                  { title: 'Độ ẩm TB (%)', dataIndex: 'avgHumidity', key: 'avgHumidity', align: 'right', render: (v) => (v != null ? v : '-') },
                  { title: 'Khoảng thời gian', key: 'days', render: (_, r) => `${r.days} ngày qua` },
                  {
                    title: 'Thao tác',
                    key: 'action',
                    width: 120,
                    render: (_, r) => (
                      <Button
                        type="link"
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => handleOpenRainfallDetail(r.districtName)}
                        disabled={!DISTRICT_WARDS[r.districtName]?.length}
                      >
                        Xem chi tiết
                      </Button>
                    ),
                  },
                ]}
                style={{ marginTop: 16 }}
              />
            )}
          </div>
        </Card>
      </section>
      ) : (
        <section className="reports-weather-cta">
          <div className="reports-card-closed">
            <Text type="secondary">Card thời tiết & lượng mưa đã đóng.</Text>
            <Button type="link" size="small" onClick={() => setShowWeatherCard(true)}>Hiển thị lại</Button>
          </div>
        </section>
      )}

      <Modal
        title={
          <span>
            <CloudOutlined style={{ marginRight: 8 }} />
            Lượng mưa chi tiết theo phường/xã — {detailDistrict}
          </span>
        }
        open={detailModalOpen}
        onCancel={() => { setDetailModalOpen(false); setDetailDistrict(null); setDetailWardData([]); }}
        footer={null}
        width={640}
        destroyOnClose
      >
        {detailLoading ? (
          <div style={{ minHeight: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Spin tip="Đang tải dữ liệu theo phường/xã..." />
          </div>
        ) : detailWardData.length > 0 ? (
          <div className="reports-detail-chart-wrap">
            <div style={{ height: 280, marginBottom: 16 }}>
              <Bar
                data={{
                  labels: detailWardData.map((w) => w.wardName),
                  datasets: [
                    {
                      label: 'Tổng lượng mưa (mm)',
                      data: detailWardData.map((w) => w.totalMm),
                      backgroundColor: 'rgba(59, 130, 246, 0.7)',
                      borderColor: '#2563eb',
                      borderWidth: 1,
                      borderRadius: 6,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                    tooltip: { callbacks: { label: (ctx) => ` ${ctx.parsed.y} mm` } },
                  },
                  scales: {
                    y: { beginAtZero: true, title: { display: true, text: 'mm' } },
                    x: { title: { display: true, text: 'Phường / Xã' } },
                  },
                }}
              />
            </div>
            <Paragraph type="secondary" style={{ marginBottom: 0 }}>
              Dữ liệu {weatherPastDays} ngày qua từ Open-Meteo theo tọa độ từng phường/xã thuộc {detailDistrict}.
            </Paragraph>
          </div>
        ) : detailDistrict && !detailLoading ? (
          <Paragraph>Không có dữ liệu chi tiết cho quận này.</Paragraph>
        ) : null}
      </Modal>
    </div>
  );
};

export default ReportsPage;

