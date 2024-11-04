import { useState } from "react";

import WorkflowList from "../components/WorkflowList";

const Workflow = () => {
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);

  const handleEditWorkflow = workflow => {
    setSelectedWorkflow(workflow);
  };

  const clearSelection = () => {
    setSelectedWorkflow(null);
  };

  return (
    <div>
      <WorkflowList onEdit={ handleEditWorkflow } />
    </div>
  );
};

export default Workflow;
