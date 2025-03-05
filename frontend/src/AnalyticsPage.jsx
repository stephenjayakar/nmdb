import React from "react";
import { Container, Row, Col, Card, Spinner } from "react-bootstrap";
import { Pie, Bar, Line } from "react-chartjs-2";
import zoomPlugin from "chartjs-plugin-zoom";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  ArcElement,
} from "chart.js";
import "chartjs-adapter-moment";
import { WordCloudController, WordElement } from "chartjs-chart-wordcloud"; // Word Cloud Plugin
import "./AnalyticsPage.css"; // Your custom styles

import { useQuery } from "convex/react";
import { api } from "./convex/_generated/api";

// Register ChartJS components and plugins
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  ArcElement,
  WordCloudController,
  WordElement,
  zoomPlugin
);

// Example: Increase default font size
ChartJS.defaults.font.size = 18;

const AnalyticsPage = ({ token }) => {
  const analyticsData = useQuery(api.messages.getAnalytics, { token });

  // While waiting for data, show a spinner.
  if (!analyticsData) {
    return (
      <Container className="text-center my-4">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  // Totals Section
  const totals = {
    totalMessages: analyticsData.num_messages.total,
    totalDays: analyticsData.num_days,
    totalWords: analyticsData.num_words_total,
    messagesPerDay: analyticsData.messages_per_day,
    stephenResponseTime: analyticsData.average_response_time_overall.stephen,
    nadiaResponseTime: analyticsData.average_response_time_overall.nadia,
  };

  // Pie Chart Data for messages per sender.
  const pieData = {
    labels: ["Nadia", "Stephen"],
    datasets: [
      {
        data: [
          analyticsData.num_messages.nadia,
          analyticsData.num_messages.stephen,
        ],
        backgroundColor: [
          "rgba(255, 99, 132, 0.6)",
          "rgba(54, 162, 235, 0.6)",
        ],
        borderWidth: 1,
      },
    ],
  };

  // Emoji Frequency Bar Chart Data.
  const emojiLabels = analyticsData.emoji_frequency.map((item) => item[0]);
  const emojiCounts = analyticsData.emoji_frequency.map((item) => item[1]);
  const emojiData = {
    labels: emojiLabels,
    datasets: [
      {
        label: "Emoji Frequency",
        data: emojiCounts,
        backgroundColor: "rgba(75, 192, 192, 0.6)",
      },
    ],
  };

  // For scrollable horizontal bar chart height calculation.
  const emojiChartHeight = Math.max(600, emojiLabels.length * 25);

  // Word Frequency Bar Chart Data.
  const wordLabels = analyticsData.word_frequency.map((item) => item[0]);
  const wordCounts = analyticsData.word_frequency.map((item) => item[1]);
  const wordData = {
    labels: wordLabels,
    datasets: [
      {
        label: "Word Frequency",
        data: wordCounts,
        backgroundColor: "rgba(153, 102, 255, 0.6)",
      },
    ],
  };

  // Message Frequency per Day per Person Line Chart.
  const days = Object.keys(
    analyticsData.message_frequency_per_day_per_person
  ).sort((a, b) => new Date(a) - new Date(b));
  const datasetNadia = days.map(
    (day) => analyticsData.message_frequency_per_day_per_person[day].nadia || 0
  );
  const datasetStephen = days.map(
    (day) =>
      analyticsData.message_frequency_per_day_per_person[day].stephen || 0
  );
  const messageFrequencyData = {
    labels: days,
    datasets: [
      {
        label: "Nadia",
        data: datasetNadia,
        borderColor: "rgba(255, 99, 132, 1)",
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        fill: false,
      },
      {
        label: "Stephen",
        data: datasetStephen,
        borderColor: "rgba(54, 162, 235, 1)",
        backgroundColor: "rgba(54, 162, 235, 0.2)",
        fill: false,
      },
    ],
  };

  // Texts per Time of Day (PST) Bar Chart Data.
  const formatTime = (hour) => {
    const intHour = parseInt(hour);
    const period = intHour < 12 ? "AM" : "PM";
    const formattedHour = intHour % 12 === 0 ? 12 : intHour % 12;
    return `${formattedHour} ${period}`;
  };
  const timeLabels = Object.keys(analyticsData.message_count_by_hour);
  const sortedTimeLabels = timeLabels.sort((a, b) => parseInt(a) - parseInt(b));
  const timeCounts = sortedTimeLabels.map(
    (time) => analyticsData.message_count_by_hour[time]
  );
  const formattedTimeLabels = sortedTimeLabels.map(formatTime);
  const textsPerTimeData = {
    labels: formattedTimeLabels,
    datasets: [
      {
        label: "Texts per Time (PST)",
        data: timeCounts,
        backgroundColor: "rgba(255, 206, 86, 0.6)",
      },
    ],
  };

  // Average Response Time per Day Line Chart Data.
  const responseDays = Object.keys(
    analyticsData.average_response_time_per_day
  ).sort((a, b) => new Date(a) - new Date(b));
  const avgResponseNadia = responseDays.map(
    (day) => analyticsData.average_response_time_per_day[day].nadia / 60 || 0
  );
  const avgResponseStephen = responseDays.map(
    (day) => analyticsData.average_response_time_per_day[day].stephen / 60 || 0
  );
  const avgResponseTimeData = {
    labels: responseDays,
    datasets: [
      {
        label: "Nadia",
        data: avgResponseNadia,
        borderColor: "rgba(255, 99, 132, 1)",
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        fill: false,
      },
      {
        label: "Stephen",
        data: avgResponseStephen,
        borderColor: "rgba(54, 162, 235, 1)",
        backgroundColor: "rgba(54, 162, 235, 0.2)",
        fill: false,
      },
    ],
  };

  // ★ NEW: Bursting Words Over Time Line Chart ★
  // We assume analyticsData.bursting_word_series is an object where each key is a word
  // and each value is an array of [date, count] pairs.
  const burstingWords = analyticsData.bursting_word_series || {};
  // Create datasets – one per bursting word.
  // Here we use a small array of colors and cycle through them.
  const presetColors = [
    "rgba(255, 99, 132, 1)",
    "rgba(54, 162, 235, 1)",
    "rgba(255, 206, 86, 1)",
    "rgba(75, 192, 192, 1)",
    "rgba(153, 102, 255, 1)",
    "rgba(255, 159, 64, 1)",
  ];
  const burstingWordDatasets = [];
  let colorIndex = 0;

  // Each dataset is built as an array of objects {x, y} so that ChartJS' time scale can parse it.
  for (const [word, series] of Object.entries(burstingWords)) {
    const dataset = {
      label: word,
      data: series.map(([date, count]) => ({ x: date, y: count })),
      borderColor: presetColors[colorIndex % presetColors.length],
      backgroundColor: presetColors[colorIndex % presetColors.length],
      fill: false,
    };
    burstingWordDatasets.push(dataset);
    colorIndex++;
  }

  // If you want to show a unified x-axis with time values, we do not need to declare labels;
  // the x values come directly from each dataset’s data.
  const burstingWordChartData = {
    datasets: burstingWordDatasets,
  };

  const burstingWordChartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: {
        display: true,
        text: "Bursting Words Over Time",
      },
      zoom: {
        pan: { enabled: true, mode: "x" },
        zoom: {
          wheel: { enabled: true },
          pinch: { enabled: true },
          mode: "x",
        },
      },
    },
    scales: {
      x: {
        type: "time",
        time: {
          parser: "YYYY-MM-DD",
          tooltipFormat: "ll",
        },
        title: { display: true, text: "Month" },
      },
      y: {
        title: { display: true, text: "Usage Count" },
      },
    },
  };

  return (
    <Container className="lovey-dashboard my-4">
      <h2 className="lovey-header mb-4">💖 Our Message Memories 💖</h2>
      {/* First Row: Totals & Pie Chart */}
      <Row className="my-4">
        <Col md={6} className="mb-4">
          <Card className="text-center shadow-sm border-0">
            <Card.Header className="bg-primary text-white">
              Totals
            </Card.Header>
            <Card.Body>
              <Row>
                <Col>
                  <h5>Total Messages</h5>
                  <p>{totals.totalMessages}</p>
                </Col>
                <Col>
                  <h5># of Days</h5>
                  <p>{totals.totalDays}</p>
                </Col>
              </Row>
              <Row className="mt-3">
                <Col>
                  <h5># of Words</h5>
                  <p>{totals.totalWords}</p>
                </Col>
                <Col>
                  <h5>Messages per Day</h5>
                  <p>{totals.messagesPerDay}</p>
                </Col>
              </Row>
              <Row className="mt-3">
                <Col>
                  <h5>Stephen's Avg. Response Time</h5>
                  <p>{totals.stephenResponseTime} seconds</p>
                </Col>
              </Row>
              <Row className="mt-2">
                <Col>
                  <h5>Nadia's Avg. Response Time</h5>
                  <p>{totals.nadiaResponseTime} seconds</p>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} className="mb-4">
          <Card className="text-center shadow-sm border-0">
            <Card.Header className="bg-success text-white">
              Who Sent More Messages?
            </Card.Header>
            <Card.Body>
              <Pie data={pieData} />
            </Card.Body>
          </Card>
        </Col>
      </Row>
      {/* Emoji Frequency & Word Frequency Bar Charts */}
      <Row>
        <Col md={6} className="mb-4">
          <Card className="lovey-card">
            <Card.Header>Emoji Frequency</Card.Header>
            <Card.Body>
              <div
                style={{
                  height: "600px",
                  overflowY: "auto",
                  border: "1px solid #ddd",
                }}
              >
                <div style={{ height: `${emojiLabels.length * 25}px` }}>
                  <Bar
                    data={emojiData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      indexAxis: "y",
                      plugins: { legend: { display: false } },
                      scales: {
                        x: { ticks: { autoSkip: false } },
                        y: { ticks: { autoSkip: false } },
                      },
                    }}
                  />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} className="mb-4">
          <Card className="lovey-card">
            <Card.Header>Word Frequency</Card.Header>
            <Card.Body>
              <div
                style={{
                  height: "600px",
                  overflowY: "auto",
                  border: "1px solid #ddd",
                }}
              >
                <div style={{ height: `${wordLabels.length * 25}px` }}>
                  <Bar
                    data={wordData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      indexAxis: "y",
                      plugins: { legend: { display: false } },
                      scales: {
                        x: { ticks: { autoSkip: false } },
                        y: { ticks: { autoSkip: false } },
                      },
                    }}
                  />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      {/* Message Frequency per Day Line Chart */}
      <Card className="lovey-card mb-4">
        <Card.Header>
          Message Frequency per Day (Nadia & Stephen)
        </Card.Header>
        <Col md={12} className="mb-4">
          <Card.Body>
            <Line
              data={messageFrequencyData}
              options={{
                responsive: true,
                plugins: {
                  legend: { position: "top" },
                  title: {
                    display: true,
                    text: "Messages per Day (try zooming!)",
                  },
                  zoom: {
                    pan: { enabled: true, mode: "x" },
                    zoom: {
                      wheel: { enabled: true },
                      pinch: { enabled: true },
                      mode: "x",
                    },
                  },
                },
              }}
            />
          </Card.Body>
        </Col>
      </Card>
      {/* Average Response Time per Day Line Chart */}
      <Card className="lovey-card mb-4">
        <Card.Header>
          Average Response Time per Day (Nadia & Stephen)
        </Card.Header>
        <Col md={12} className="mb-4">
          <Card.Body>
            <Line
              data={avgResponseTimeData}
              options={{
                responsive: true,
                plugins: {
                  legend: { position: "top" },
                  title: {
                    display: true,
                    text: "Average Response Time per Day (in minutes)",
                  },
                  zoom: {
                    pan: { enabled: true, mode: "x" },
                    zoom: {
                      wheel: { enabled: true },
                      pinch: { enabled: true },
                      mode: "x",
                    },
                  },
                },
              }}
            />
          </Card.Body>
        </Col>
      </Card>
      {/* Texts per Time of Day Bar Chart */}
      <Card className="lovey-card mb-4">
        <Card.Header>Texts per Time of Day (PST)</Card.Header>
        <Col md={12} className="mb-4">
          <Card.Body>
            <Bar
              data={textsPerTimeData}
              options={{
                responsive: true,
                plugins: { legend: { display: false } },
              }}
            />
          </Card.Body>
        </Col>
      </Card>
      {/* ★ NEW: Overlaid Bursting Words Line Chart */}
      {burstingWordDatasets.length > 0 && (
        <Card className="lovey-card mb-4">
          <Card.Header>Bursting Words Over Time</Card.Header>
          <Col md={12} className="mb-4">
            <Card.Body>
              <Line
                data={burstingWordChartData}
                options={burstingWordChartOptions}
              />
            </Card.Body>
          </Col>
        </Card>
      )}
    </Container>
  );
};

export default AnalyticsPage;
