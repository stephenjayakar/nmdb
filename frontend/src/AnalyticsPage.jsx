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
import "./AnalyticsPage.css";

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

ChartJS.defaults.font.size = 18;

const AnalyticsPage = ({ token }) => {
  const analyticsData = useQuery(api.messages.getAnalytics, { token });

  if (!analyticsData) {
    return (
      <Container className="text-center my-4">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  // Totals Section remains unchanged
  const totals = {
    totalMessages: analyticsData.num_messages.total,
    totalDays: analyticsData.num_days,
    totalWords: analyticsData.num_words_total,
    messagesPerDay: analyticsData.messages_per_day,
    stephenResponseTime: analyticsData.average_response_time_overall.stephen,
    nadiaResponseTime: analyticsData.average_response_time_overall.nadia,
  };

  // Pie Chart Data for Who Sent More Messages.
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

  // Emoji Frequency Bar Chart (unchanged)
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
  const emojiChartHeight = Math.max(600, emojiLabels.length * 25);

  // Word Frequency Bar Chart (unchanged)
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

  // MESSAGE FREQUENCY PER DAY PER PERSON → DATA WITH MOMENT SUPPORT
  // Instead of providing labels array, we build each data point with x and y.
  const days = Object.keys(analyticsData.message_frequency_per_day_per_person).sort(
    (a, b) => new Date(a) - new Date(b)
  );
  const datasetNadia = days.map(day => ({
    x: day,
    y: analyticsData.message_frequency_per_day_per_person[day].nadia || 0,
  }));
  const datasetStephen = days.map(day => ({
    x: day,
    y: analyticsData.message_frequency_per_day_per_person[day].stephen || 0,
  }));
  const messageFrequencyData = {
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

  const messageFrequencyOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
        // Add onClick logic if desired for these charts too.
      },
      title: {
        display: true,
        text: "Messages per Day (Nadia & Stephen)",
      },
      zoom: {
        pan: { enabled: true, mode: "x" },
        zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: "x" },
      },
    },
    scales: {
      x: {
        type: "time",
        time: {
          parser: "YYYY-MM-DD",
          tooltipFormat: "ll",
        },
        title: { display: true, text: "Day" },
      },
      y: {
        title: { display: true, text: "Message Count" },
      },
    },
  };

  // AVERAGE RESPONSE TIME PER DAY → DATA WITH MOMENT SUPPORT
  // We assume responseDays are already strings in YYYY-MM-DD.
  const responseDays = Object.keys(analyticsData.average_response_time_per_day)
    .sort((a, b) => new Date(a) - new Date(b));
  const datasetResponseNadia = responseDays.map(day => ({
    x: day,
    y: (analyticsData.average_response_time_per_day[day].nadia || 0) / 60,
  }));
  const datasetResponseStephen = responseDays.map(day => ({
    x: day,
    y: (analyticsData.average_response_time_per_day[day].stephen || 0) / 60,
  }));
  const avgResponseTimeData = {
    datasets: [
      {
        label: "Nadia",
        data: datasetResponseNadia,
        borderColor: "rgba(255, 99, 132, 1)",
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        fill: false,
      },
      {
        label: "Stephen",
        data: datasetResponseStephen,
        borderColor: "rgba(54, 162, 235, 1)",
        backgroundColor: "rgba(54, 162, 235, 0.2)",
        fill: false,
      },
    ],
  };

  const avgResponseTimeOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
        // If you want a custom select-one behavior, you can add an onClick callback here too.
      },
      title: {
        display: true,
        text: "Average Response Time per Day (minutes)",
      },
      zoom: {
        pan: { enabled: true, mode: "x" },
        zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: "x" },
      },
    },
    scales: {
      x: {
        type: "time",
        time: {
          parser: "YYYY-MM-DD",
          tooltipFormat: "ll",
        },
        title: { display: true, text: "Day" },
      },
      y: {
        title: { display: true, text: "Avg. Response Time (minutes)" },
      },
    },
  };

  // BURSTING WORDS—CUSTOM LEGEND ONCLICK TO SELECT A SINGLE WORD
  const burstingWords = analyticsData.bursting_word_series || {};
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
  const burstingWordChartData = {
    datasets: burstingWordDatasets,
  };

  // Custom onClick in legend so that selecting a legend item shows only that dataset.
  const burstingWordChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
        onClick: (e, legendItem, legend) => {
          const ci = legend.chart;
          const index = legendItem.datasetIndex;
          const alreadyOnlyOne =
            ci.data.datasets.filter((d, i) => !ci.getDatasetMeta(i).hidden).length === 1 &&
            !ci.isDatasetVisible(index);
          if (alreadyOnlyOne) {
            // If the clicked dataset is already the only one visible, restore all
            ci.data.datasets.forEach((dataset, i) => {
              ci.getDatasetMeta(i).hidden = false;
            });
          } else {
            ci.data.datasets.forEach((dataset, i) => {
              ci.getDatasetMeta(i).hidden = i !== index;
            });
          }
          ci.update();
        },
      },
      title: {
        display: true,
        text: "Bursting Words Over Time",
      },
      zoom: {
        pan: { enabled: true, mode: "x" },
        zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: "x" },
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
      {/* Totals & Pie Chart (unchanged) */}
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
      {/* Emoji and Word Frequency Bar Charts (unchanged) */}
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
      {/* MESSAGE FREQUENCY PER DAY LINE CHART */}
      <Card className="lovey-card mb-4">
        <Card.Header>Message Frequency per Day (Nadia & Stephen)</Card.Header>
        <Col md={12} className="mb-4">
          <Card.Body>
            <Line data={messageFrequencyData} options={messageFrequencyOptions} />
          </Card.Body>
        </Col>
      </Card>
      {/* AVERAGE RESPONSE TIME PER DAY LINE CHART */}
      <Card className="lovey-card mb-4">
        <Card.Header>Average Response Time per Day (Minutes)</Card.Header>
        <Col md={12} className="mb-4">
          <Card.Body>
            <Line data={avgResponseTimeData} options={avgResponseTimeOptions} />
          </Card.Body>
        </Col>
      </Card>
      {/* TEXTS PER TIME OF DAY BAR CHART (unchanged) */}
      <Card className="lovey-card mb-4">
        <Card.Header>Texts per Time of Day (PST)</Card.Header>
        <Col md={12} className="mb-4">
          <Card.Body>
            <Bar
              data={{
                labels: Object.keys(analyticsData.message_count_by_hour)
                  .sort((a, b) => parseInt(a) - parseInt(b))
                  .map(hour => {
                    const intHour = parseInt(hour);
                    return (intHour % 12 === 0 ? 12 : intHour % 12) + (intHour < 12 ? " AM" : " PM");
                  }),
                datasets: [
                  {
                    label: "Texts per Time (PST)",
                    data: Object.keys(analyticsData.message_count_by_hour)
                      .sort((a, b) => parseInt(a) - parseInt(b))
                      .map(hour => analyticsData.message_count_by_hour[hour]),
                    backgroundColor: "rgba(255, 206, 86, 0.6)",
                  },
                ],
              }}
              options={{
                responsive: true,
                plugins: { legend: { display: false } },
              }}
            />
          </Card.Body>
        </Col>
      </Card>
      {/* BURSTING WORDS OVER TIME LINE CHART (with custom legend for single‐selection) */}
      {burstingWordDatasets.length > 0 && (
        <Card className="lovey-card mb-4">
          <Card.Header>Bursting Words Over Time</Card.Header>
          <Col md={12} className="mb-4">
            <Card.Body>
              <Line data={burstingWordChartData} options={burstingWordChartOptions} />
            </Card.Body>
          </Col>
        </Card>
      )}
    </Container>
  );
};

export default AnalyticsPage;
