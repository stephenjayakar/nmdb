import React from "react";
import { Container, Row, Col, Card } from "react-bootstrap";
import { Pie, Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,     // Import the Bar element
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";

// Register all necessary components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,     // Register the Bar element
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const AnalyticsPage = () => {
  // Totals section sample data
  const totals = {
    totalMessages: 1200,
    totalDays: 30,
    totalWords: 8000,
    messagesPerDay: 40,
  };

  // Pie Chart Data: Who sent more messages?
  const pieData = {
    labels: ["Nadia", "Stephen"],
    datasets: [
      {
        data: [500, 700],
        backgroundColor: ["rgba(255, 99, 132, 0.6)", "rgba(54, 162, 235, 0.6)"],
        borderWidth: 1,
      },
    ],
  };

  // Emoji Frequency Bar Chart
  const emojiData = {
    labels: ["😀", "😂", "😢", "😍"],
    datasets: [
      {
        label: "Emoji Frequency",
        data: [45, 75, 30, 50],
        backgroundColor: "rgba(75, 192, 192, 0.6)",
      },
    ],
  };

  // Word Frequency Bar Chart
  const wordData = {
    labels: ["hello", "bye", "thanks", "love"],
    datasets: [
      {
        label: "Word Frequency",
        data: [120, 80, 60, 100],
        backgroundColor: "rgba(153, 102, 255, 0.6)",
      },
    ],
  };

  // Message Frequency Line Chart (per day for Nadia & Stephen)
  const messageFrequencyLabels = [
    "Day 1",
    "Day 2",
    "Day 3",
    "Day 4",
    "Day 5",
    "Day 6",
    "Day 7",
  ];
  const messageFrequencyData = {
    labels: messageFrequencyLabels,
    datasets: [
      {
        label: "Nadia",
        data: [20, 25, 30, 22, 18, 27, 30],
        borderColor: "rgba(255, 99, 132, 1)",
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        fill: false,
      },
      {
        label: "Stephen",
        data: [30, 35, 40, 32, 28, 37, 40],
        borderColor: "rgba(54, 162, 235, 1)",
        backgroundColor: "rgba(54, 162, 235, 0.2)",
        fill: false,
      },
    ],
  };

  // Texts per Time of Day (PST) Bar Chart
  const timeOfDayLabels = ["12AM", "3AM", "6AM", "9AM", "12PM", "3PM", "6PM", "9PM"];
  const textsPerTimeData = {
    labels: timeOfDayLabels,
    datasets: [
      {
        label: "Texts per Time (PST)",
        data: [5, 15, 30, 50, 40, 35, 20, 10],
        backgroundColor: "rgba(255, 206, 86, 0.6)",
      },
    ],
  };

  return (
    <Container className="my-4">
      <h2 className="mb-4">Analytics Dashboard</h2>

      {/* Totals Section */}
      <Card className="mb-4">
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

      {/* Pie Chart Section */}
      <Card className="mb-4">
        <Card.Header>Who Sent More Messages?</Card.Header>
        <Card.Body>
          <Pie data={pieData} />
        </Card.Body>
      </Card>

      <Row>
        {/* Emoji Frequency Bar Chart */}
        <Col md={6} className="mb-4">
          <Card>
            <Card.Header>Emoji Frequency</Card.Header>
            <Card.Body>
              <Bar
                data={emojiData}
                options={{ responsive: true, plugins: { legend: { display: false } } }}
              />
            </Card.Body>
          </Card>
        </Col>

        {/* Word Frequency Bar Chart */}
        <Col md={6} className="mb-4">
          <Card>
            <Card.Header>Word Frequency</Card.Header>
            <Card.Body>
              <Bar
                data={wordData}
                options={{ responsive: true, plugins: { legend: { display: false } } }}
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Message Frequency Line Chart */}
      <Card className="mb-4">
        <Card.Header>Message Frequency per Day (Nadia & Stephen)</Card.Header>
        <Card.Body>
          <Line
            data={messageFrequencyData}
            options={{
              responsive: true,
              plugins: {
                legend: { position: "top" },
                title: { display: true, text: "Messages per Day" },
              },
            }}
          />
        </Card.Body>
      </Card>

      {/* Texts per Time of Day (PST) */}
      <Card className="mb-4">
        <Card.Header>Texts per Time of Day (PST)</Card.Header>
        <Card.Body>
          <Bar
            data={textsPerTimeData}
            options={{ responsive: true, plugins: { legend: { display: false } } }}
          />
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AnalyticsPage;
