import { cleanup, screen } from "@testing-library/react";
import { within } from "@testing-library/react/pure";
import { ConnectorDetails } from "src/app/features/connectors/details/ConnectorDetails";
import { ConnectorOverview, getConnectorOverview } from "src/domain/connector";
import { customRender } from "src/services/test-utils/render-with-wrappers";

const mockUseParams = jest.fn();
const mockMatches = jest.fn();
const mockedNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: () => mockUseParams(),
  useMatches: () => mockMatches(),
  Navigate: () => mockedNavigate(),
}));

jest.mock("src/domain/connector/connector-api");

const mockGetConnectorOverview = getConnectorOverview as jest.MockedFunction<
  typeof getConnectorOverview
>;

const testConnectorName = "my-connector";
const testConnectorOverview: ConnectorOverview = {
  connectorInfo: {
    connectorId: 1,
    connectorStatus: "statusplaceholder",
    connectorName: testConnectorName,
    runningTasks: 0,
    failedTasks: 0,
    environmentId: "4",
    teamName: "Ospo",
    teamId: 0,
    showEditConnector: true,
    showDeleteConnector: true,
    connectorDeletable: true,
    connectorConfig:
      '{\n  "connector.class" : "io.confluent.connect.storage.tools.SchemaSourceConnector",\n  "tasks.max" : "1",\n  "name" : "my-connector",\n  "topic" : "testtopic",\n  "topics.regex" : "*"\n}',
    environmentName: "DEV",
  },
  topicHistoryList: [],
  promotionDetails: {
    sourceEnv: "4",
    connectorName: testConnectorName,
    targetEnvId: "6",
    sourceConnectorConfig:
      '{\n  "connector.class" : "io.confluent.connect.storage.tools.SchemaSourceConnector",\n  "tasks.max" : "1",\n  "name" : "my-connector",\n  "topic" : "testtopic",\n  "topics.regex" : "*"\n}',
    targetEnv: "ACC",
    status: "success",
  },
  connectorExists: true,
  availableEnvironments: [
    {
      id: "3",
      name: "DEV",
    },
    {
      id: "10",
      name: "ACC",
    },
  ],
  topicIdForDocumentation: 1003,
};

describe("ConnectorDetails", () => {
  // const user = userEvent.setup();

  beforeEach(() => {
    mockGetConnectorOverview.mockResolvedValue(testConnectorOverview);

    mockUseParams.mockReturnValue({
      connectornamesearch: testConnectorName,
    });

    mockedNavigate.mockImplementation(() => {
      return <div data-testid={"react-router-navigate"} />;
    });
  });

  describe("fetches the connector overview based on connector name", () => {
    beforeAll(() => {
      mockMatches.mockImplementation(() => [
        {
          id: "CONNECTOR_OVERVIEW_TAB_ENUM_overview",
        },
      ]);
    });

    afterAll(() => {
      cleanup();
      jest.resetAllMocks();
    });

    it("fetches connector overview and schema data on first load of page", async () => {
      customRender(<ConnectorDetails connectorName={testConnectorName} />, {
        memoryRouter: true,
        queryClient: true,
      });
      expect(mockGetConnectorOverview).toHaveBeenCalledWith({
        connectornamesearch: testConnectorName,
      });
    });

    // @ TODO add this test when envirnmentID param is added and switcher is implemented
    // it("fetches the data anew when user changes environment", async () => {
    //   customRender(<ConnectorDetails connectorName={testConnectorName} />, {
    //     memoryRouter: true,
    //     queryClient: true,
    //   });

    //   const select = await screen.findByRole("combobox", {
    //     name: "Select environment",
    //   });

    //   await user.selectOptions(
    //     select,
    //     testConnectorOverview.availableEnvironments[1].name
    //   );

    //   await waitFor(() =>
    //     expect(mockGetConnectorOverview).toHaveBeenCalledWith({
    //       connectorName: testConnectorName,
    //       environmentId: testConnectorOverview.availableEnvironments[1].id,
    //     })
    //   );
    // });
  });

  describe("renders the correct tab navigation based on router match", () => {
    afterEach(cleanup);

    it("shows the tablist with Overview as currently active panel", () => {
      mockMatches.mockImplementationOnce(() => [
        {
          id: "CONNECTOR_OVERVIEW_TAB_ENUM_overview",
        },
      ]);

      customRender(<ConnectorDetails connectorName={testConnectorName} />, {
        memoryRouter: true,
        queryClient: true,
      });

      const tabList = screen.getByRole("tablist");
      const activeTab = within(tabList).getByRole("tab", { selected: true });

      expect(tabList).toBeVisible();
      expect(activeTab).toHaveAccessibleName("Overview");
    });

    it("shows the tablist with History as currently active panel", () => {
      mockMatches.mockImplementationOnce(() => [
        {
          id: "CONNECTOR_OVERVIEW_TAB_ENUM_history",
        },
      ]);

      customRender(<ConnectorDetails connectorName={testConnectorName} />, {
        memoryRouter: true,
        queryClient: true,
      });

      const tabList = screen.getByRole("tablist");
      const activeTab = within(tabList).getByRole("tab", { selected: true });

      expect(tabList).toBeVisible();
      expect(activeTab).toHaveAccessibleName("History");
    });
  });

  describe("only renders header and tablist if route is matching defined tabs", () => {
    afterEach(cleanup);

    it("does render content if the route matches an existing tab", () => {
      mockMatches.mockImplementation(() => [
        {
          id: "CONNECTOR_OVERVIEW_TAB_ENUM_overview",
        },
      ]);

      customRender(<ConnectorDetails connectorName={testConnectorName} />, {
        memoryRouter: true,
        queryClient: true,
      });

      const tabList = screen.getByRole("tablist");

      expect(tabList).toBeVisible();
      expect(mockedNavigate).not.toHaveBeenCalled();
    });

    it("redirects user to connector overview if the route does not matches an existing tab", () => {
      mockMatches.mockImplementation(() => [
        {
          id: "something",
        },
      ]);

      customRender(<ConnectorDetails connectorName={testConnectorName} />, {
        memoryRouter: true,
        queryClient: true,
      });

      const tabList = screen.queryByRole("tablist");

      expect(tabList).not.toBeInTheDocument();

      expect(mockedNavigate).toHaveBeenCalled();
    });
  });
});
