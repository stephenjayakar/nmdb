import React from "react";
import { Container, Row, Col, Card, Spinner } from "react-bootstrap";
import { Pie, Bar, Line, Chart } from "react-chartjs-2";
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
  ArcElement,
} from "chart.js";
import { WordCloudController, WordElement } from "chartjs-chart-wordcloud"; // Word Cloud Plugin
import "./AnalyticsPage.css"; // Your custom styles

import { useQuery } from "convex/react";
import { api } from "./convex/_generated/api";

// Register ChartJS components and WordCloud plugin
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  WordCloudController,
  WordElement,
  zoomPlugin,
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
  };

  // Pie Chart Data
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

  // Emoji Frequency Bar Chart Data
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

  // For scrollable horizontal bar chart height calculation:
  const emojiChartHeight = Math.max(600, emojiLabels.length * 25);

  // Word Frequency Bar Chart Data
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

  const labels = [];
  const data = [];

  // Populate the arrays with entries from the word frequencies map
  for (const [_, tpl] of Object.entries(analyticsData.word_frequency)) {
    labels.push(tpl[0]);
    data.push(tpl[1] / 100);
  }
  const wordCloudData = {
    labels: labels,
    datasets: [
      {
        label: 'Score',
        data: data,
      },
    ],
  };

  // For now, we use testData.
  // const wordCloudData = testData;

  // Message Frequency per Day per Person
  const days = Object.keys(
    analyticsData.message_frequency_per_day_per_person
  ).sort((a, b) => new Date(a) - new Date(b));

  const datasetNadia = days.map(
    (day) => analyticsData.message_frequency_per_day_per_person[day].nadia || 0
  );
  const datasetStephen = days.map(
    (day) => analyticsData.message_frequency_per_day_per_person[day].stephen || 0
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

  // Texts per Time of Day (PST)
  const timeLabels = Object.keys(analyticsData.message_count_by_hour);
  const sortedTimeLabels = timeLabels.sort((a, b) => parseInt(a) - parseInt(b));
  const timeCounts = sortedTimeLabels.map(
    (time) => analyticsData.message_count_by_hour[time]
  );
  const textsPerTimeData = {
    labels: sortedTimeLabels,
    datasets: [
      {
        label: "Texts per Time (PST)",
        data: timeCounts,
        backgroundColor: "rgba(255, 206, 86, 0.6)",
      },
    ],
  };

  // TODO: temp
  // analyticsData.average_response_time_per_day = {
  //   "2023-09-01": { "nadia": 25, "stephen": 40 },
  //   "2023-09-02": { "nadia": 30, "stephen": 35 },
  //   "2023-09-03": { "nadia": 20, "stephen": 45 }
  // };
  // NEW: Average Response Time per Day Data
  const responseDays = Object.keys(analyticsData.average_response_time_per_day).sort(
    (a, b) => new Date(a) - new Date(b)
  );
  const avgResponseNadia = responseDays.map(
    (day) => analyticsData.average_response_time_per_day[day].nadia || 0
  );
  const avgResponseStephen = responseDays.map(
    (day) => analyticsData.average_response_time_per_day[day].stephen || 0
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

  return (
    <Container className="lovey-dashboard my-4">
      <h2 className="lovey-header mb-4">💖 Our Message Memories 💖</h2>

      {/* First Row: Totals & Pie Chart */}
      <Row>
        <Col md={6} className="mb-4">
          <Card className="lovey-card mb-4">
            <Card.Header>Totals</Card.Header>
            <Card.Body>
              <Row>
                <Col>
                  <strong>Total Messages:</strong> {totals.totalMessages}
                </Col>
                <Col>
                  <strong># of Days:</strong> {totals.totalDays}
                </Col>
              </Row>
              <Row className="mt-3">
                <Col>
                  <strong># of Words:</strong> {totals.totalWords}
                </Col>
                <Col>
                  <strong>Messages per Day:</strong> {totals.messagesPerDay}
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} className="mb-4">
          <Card className="lovey-card mb-4">
            <Card.Header>Who Sent More Messages?</Card.Header>
            <Card.Body>
              <Pie data={pieData} />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Word Cloud Section commented out
      <Row className="mb-4">
        <Col md={12}>
          <Card className="lovey-card">
            <Card.Header>Word Cloud</Card.Header>
            <Card.Body>
              <div style={{ height: "400px" }}>
                <Chart
                  type={WordCloudController.id}
                  data={wordCloudData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    // Additional word cloud-specific options can be added here, if needed.
                  }}
                />
              </div>
            </Card.Body>
          </Card>
        </Col>
    </Row>
    */}

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
                title: { display: true, text: "Messages per Day (try zooming!)" },
                // Enable zooming and panning on the x-axis:
                zoom: {
                  pan: {
                    enabled: true,
                    mode: "x",
                  },
                  zoom: {
                    wheel: { enabled: true }, // Allow zooming with the mouse wheel
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

      {/* NEW: Average Response Time per Day Line Chart */}
  <Card className="lovey-card mb-4">
    <Card.Header>Average Response Time per Day (Nadia & Stephen)</Card.Header>
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
              text: "Average Response Time per Day (in seconds)",
            },
             zoom: {
              pan: { enabled: true, mode: "x" },
              zoom: {
               wheel: { enabled: true },
               pinch: { enabled: true },
               mode: "x",
             },
            },
                      }}}
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
    </Container>
  );
};

export default AnalyticsPage;
