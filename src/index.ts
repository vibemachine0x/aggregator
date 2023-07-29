import { getUnixTime } from "date-fns";
import { useFetchPositions } from "./app/lp/hooks/fetch";
import { useAddress } from "./app/lp/hooks/useAddress";
import { useChainId } from "./app/lp/hooks/useChainId";

const main = async () => {
  try {
    const data = await useFetchPositions(
      useChainId(),
      useAddress(),
      getUnixTime(new Date())
    );
    console.log("data", data);
  } catch (error) {
    console.log("main", error);
  }
};

main();
